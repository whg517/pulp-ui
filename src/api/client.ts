import type { ApiError, PulpPagination } from '@/types/pulp'

const API_BASE_PATH = '/pulp/api/v3'

export class PulpApiError extends Error {
  status: number
  data: ApiError

  constructor(status: number, data: ApiError) {
    super(data.detail || `API Error: ${status}`)
    this.name = 'PulpApiError'
    this.status = status
    this.data = data
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

function getAuthHeader(): HeadersInit {
  const auth = localStorage.getItem('pulp_auth')
  if (auth) {
    return { Authorization: `Basic ${auth}` }
  }
  return {}
}

function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_BASE_PATH}${endpoint}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })
  }
  return url.toString()
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options
  const url = buildUrl(endpoint, params)

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...fetchOptions.headers,
    },
  })

  // Handle 202 Accepted - task spawned
  if (response.status === 202) {
    const data = await response.json()
    return { ...data, _status: 202 } as T
  }

  if (!response.ok) {
    let errorData: ApiError = { detail: response.statusText }
    try {
      errorData = await response.json()
    } catch {
      // Ignore JSON parse errors
    }
    throw new PulpApiError(response.status, errorData)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// Paginated request helper
export async function apiPaginatedRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<PulpPagination<T>> {
  return apiRequest<PulpPagination<T>>(endpoint, options)
}

// Auth helpers
export function setAuthCredentials(username: string, password: string): void {
  const encoded = btoa(`${username}:${password}`)
  localStorage.setItem('pulp_auth', encoded)
}

export function clearAuthCredentials(): void {
  localStorage.removeItem('pulp_auth')
}

export function hasAuthCredentials(): boolean {
  return localStorage.getItem('pulp_auth') !== null
}

// API endpoints object for easier imports
export const pulpApi = {
  // Status
  getStatus: () => apiRequest('/status/'),

  // Repositories
  getRepositories: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/repositories/', { params }),

  getRepository: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  createRepository: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/repositories/', { method: 'POST', body: JSON.stringify(data) }),

  updateRepository: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(href.replace(API_BASE_PATH, ''), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRepository: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),

  syncRepository: (href: string, remote?: string) =>
    apiRequest(`${href.replace(API_BASE_PATH, '')}sync/`, {
      method: 'POST',
      body: JSON.stringify(remote ? { remote } : {}),
    }),

  // Remotes
  getRemotes: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/remotes/', { params }),

  getRemote: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  createRemote: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/remotes/', { method: 'POST', body: JSON.stringify(data) }),

  updateRemote: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(href.replace(API_BASE_PATH, ''), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRemote: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),

  // Distributions
  getDistributions: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/distributions/', { params }),

  getDistribution: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  createDistribution: (data: Partial<Record<string, unknown>>) =>
    apiRequest('/distributions/', { method: 'POST', body: JSON.stringify(data) }),

  updateDistribution: (href: string, data: Partial<Record<string, unknown>>) =>
    apiRequest(href.replace(API_BASE_PATH, ''), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteDistribution: (href: string) =>
    apiRequest(href.replace(API_BASE_PATH, ''), { method: 'DELETE' }),

  // Tasks
  getTasks: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/tasks/', { params }),

  getTask: (href: string) => apiRequest(href.replace(API_BASE_PATH, '')),

  cancelTask: (href: string) =>
    apiRequest(`${href.replace(API_BASE_PATH, '')}cancel/`, { method: 'POST' }),

  // Content
  getContent: (params?: Record<string, string | number | boolean | undefined>) =>
    apiPaginatedRequest('/content/', { params }),
}
