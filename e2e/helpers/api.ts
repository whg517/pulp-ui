import type { APIRequestContext } from '@playwright/test'
import type { PulpTask } from '../../src/types/pulp'
import { getBasicAuthHeader, TEST_CREDENTIALS } from './auth'

/**
 * Custom error class for Pulp API errors
 */
export class PulpAPIError extends Error {
  public readonly status: number
  public readonly details: unknown

  constructor(status: number, details: unknown) {
    const message =
      typeof details === 'object' && details !== null && 'detail' in details
        ? String((details as { detail: unknown }).detail)
        : `API request failed with status ${status}`

    super(message)
    this.name = 'PulpAPIError'
    this.status = status
    this.details = details
  }
}

/**
 * Custom error class for Pulp task failures
 */
export class PulpTaskError extends Error {
  public readonly task: PulpTask

  constructor(task: PulpTask) {
    super(`Task "${task.name}" failed: ${task.error ?? 'Unknown error'}`)
    this.name = 'PulpTaskError'
    this.task = task
  }
}

/**
 * Custom error class for task polling timeout
 */
export class PulpTaskTimeoutError extends Error {
  public readonly taskHref: string

  constructor(taskHref: string, timeout: number) {
    super(`Task ${taskHref} did not complete within ${timeout}ms`)
    this.name = 'PulpTaskTimeoutError'
    this.taskHref = taskHref
  }
}

/**
 * Client for interacting with the Pulp REST API
 */
export class PulpAPIClient {
  private readonly request: APIRequestContext
  private readonly baseURL: string
  private readonly authHeader: string

  constructor(request: APIRequestContext, baseURL: string) {
    this.request = request
    this.baseURL = baseURL
    this.authHeader = getBasicAuthHeader(
      TEST_CREDENTIALS.username,
      TEST_CREDENTIALS.password
    )
  }

  /**
   * Build URL with query parameters
   * Handles both relative paths (e.g., '/repositories/') and full API paths (e.g., '/pulp/api/v3/tasks/123/')
   */
  private buildURL(path: string, params?: Record<string, string>): string {
    let url: string

    // If path already contains the full API prefix, extract just the base host:port
    if (path.includes('/pulp/api/v3/')) {
      // Extract the host:port from baseURL (everything before /pulp/api/v3)
      const baseHost = this.baseURL.split('/pulp/api/v3')[0]
      url = `${baseHost}${path}`
    } else {
      url = `${this.baseURL}${path}`
    }

    if (!params || Object.keys(params).length === 0) {
      return url
    }
    const searchParams = new URLSearchParams(params)
    return `${url}?${searchParams.toString()}`
  }

  /**
   * Get default headers including authentication
   */
  private getHeaders(): Record<string, string> {
    return {
      Authorization: this.authHeader,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Make a GET request to the Pulp API
   * @param path - API path (e.g., '/repositories/')
   * @param params - Optional query parameters
   * @returns The parsed JSON response
   * @throws PulpAPIError if the request fails
   */
  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = this.buildURL(path, params)
    const response = await this.request.get(url, {
      headers: this.getHeaders(),
    })

    if (!response.ok()) {
      const errorDetails = await response.json().catch(() => ({}))
      throw new PulpAPIError(response.status(), errorDetails)
    }

    return response.json() as Promise<T>
  }

  /**
   * Make a POST request to the Pulp API
   * @param path - API path (e.g., '/repositories/')
   * @param body - Request body object
   * @returns The parsed JSON response
   * @throws PulpAPIError if the request fails
   */
  async post<T>(path: string, body: object): Promise<T> {
    const url = this.buildURL(path)
    const response = await this.request.post(url, {
      headers: this.getHeaders(),
      data: JSON.stringify(body),
    })

    if (!response.ok()) {
      const errorDetails = await response.json().catch(() => ({}))
      throw new PulpAPIError(response.status(), errorDetails)
    }

    return response.json() as Promise<T>
  }

  /**
   * Make a PATCH request to the Pulp API
   * @param path - API path (e.g., '/repositories/123/')
   * @param body - Request body object with partial updates
   * @returns The parsed JSON response
   * @throws PulpAPIError if the request fails
   */
  async patch<T>(path: string, body: object): Promise<T> {
    const url = this.buildURL(path)
    const response = await this.request.patch(url, {
      headers: this.getHeaders(),
      data: JSON.stringify(body),
    })

    if (!response.ok()) {
      const errorDetails = await response.json().catch(() => ({}))
      throw new PulpAPIError(response.status(), errorDetails)
    }

    return response.json() as Promise<T>
  }

  /**
   * Make a DELETE request to the Pulp API
   * @param path - API path (e.g., '/repositories/123/')
   * @throws PulpAPIError if the request fails
   */
  async delete(path: string): Promise<void> {
    const url = this.buildURL(path)
    const response = await this.request.delete(url, {
      headers: this.getHeaders(),
    })

    if (!response.ok()) {
      const errorDetails = await response.json().catch(() => ({}))
      throw new PulpAPIError(response.status(), errorDetails)
    }
  }

  /**
   * Poll a task until it reaches a terminal state
   * @param taskHref - The href of the task to poll
   * @param timeout - Maximum time to wait in milliseconds (default: 120000)
   * @returns The completed task
   * @throws PulpTaskError if the task fails
   * @throws PulpTaskTimeoutError if the task doesn't complete within timeout
   */
  async pollTask(taskHref: string, timeout = 120000): Promise<PulpTask> {
    const startTime = Date.now()
    const pollInterval = 1000 // 1 second

    while (Date.now() - startTime < timeout) {
      const task = await this.get<PulpTask>(taskHref)

      // Check if task is in a terminal state
      if (task.state === 'completed') {
        return task
      }

      if (task.state === 'failed') {
        throw new PulpTaskError(task)
      }

      if (task.state === 'canceled') {
        throw new PulpTaskError(task)
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollInterval))
    }

    throw new PulpTaskTimeoutError(taskHref, timeout)
  }
}

/**
 * Factory function to create a PulpAPIClient with default configuration
 * @param request - Playwright APIRequestContext instance
 * @returns Configured PulpAPIClient instance
 */
export function createAPIClient(request: APIRequestContext): PulpAPIClient {
  // In CI or E2E test environment, use port 24817 (internal API) directly
  // as nginx on 8080 may not be properly configured or ready
  // This matches the vite.config.ts proxy configuration for E2E tests
  const baseURL = process.env.CI || process.env.E2E_TEST
    ? 'http://localhost:24817/pulp/api/v3'
    : 'http://localhost:8080/pulp/api/v3'
  return new PulpAPIClient(request, baseURL)
}
