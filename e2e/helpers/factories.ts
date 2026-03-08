import type { PulpRepository, PulpRemote, PulpDistribution } from '../../src/types/pulp.js'
import type { PulpAPIClient } from './api.js'

// Module-level counters for unique name generation
let repositoryCounter = 0
let remoteCounter = 0
let distributionCounter = 0
const artifactCounter = 0

/**
 * Generate a unique name for test entities
 * Format: test-{entityType}-{timestamp}-{counter}-{random}
 */
function generateUniqueName(entityType: string, counter: number): string {
  const random = Math.random().toString(36).substring(2, 8)
  return `test-${entityType}-${Date.now()}-${counter}-${random}`
}

/**
 * Response type for Pulp async operations that return a task
 */
interface PulpTaskResponse {
  task: string
}

/**
 * Check if a response is a task response (async operation)
 */
function isTaskResponse(response: unknown): response is PulpTaskResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'task' in response &&
    typeof (response as PulpTaskResponse).task === 'string'
  )
}

/**
 * Wait for a task to complete and return the created resource
 * @param api - PulpAPIClient instance
 * @param taskHref - The href of the task to poll
 * @param resourceType - The type of resource being created (for error messages)
 * @returns The created resource from the task's created_resources
 */
async function waitForTaskAndGetResource<T>(
  api: PulpAPIClient,
  taskHref: string,
  resourceType: string
): Promise<T> {
  const task = await api.pollTask(taskHref)

  if (task.state !== 'completed') {
    throw new Error(`${resourceType} creation task failed: ${task.error ?? 'Unknown error'}`)
  }

  // Get the created resource from the task's created_resources
  if (!task.created_resources || task.created_resources.length === 0) {
    throw new Error(`${resourceType} creation task completed but no resources were created`)
  }

  // Fetch and return the created resource
  const resourceHref = task.created_resources[0]
  return api.get<T>(resourceHref)
}

/**
 * Create a Pulp file repository
 * @param api - PulpAPIClient instance
 * @param overrides - Optional partial repository data to override defaults
 * @returns The created repository with pulp_href
 */
export async function createRepository(
  api: PulpAPIClient,
  overrides?: Partial<PulpRepository>
): Promise<PulpRepository> {
  repositoryCounter++
  const name = generateUniqueName('repo', repositoryCounter)

  const body = {
    name,
    description: `Test repository created at ${new Date().toISOString()}`,
    ...overrides,
  }

  const response = await api.post<PulpRepository | PulpTaskResponse>('/repositories/file/file/', body)

  // If response is a task, wait for it to complete
  if (isTaskResponse(response)) {
    return waitForTaskAndGetResource<PulpRepository>(api, response.task, 'Repository')
  }

  return response
}

/**
 * Create a Pulp file remote
 * @param api - PulpAPIClient instance
 * @param overrides - Optional partial remote data to override defaults
 * @returns The created remote with pulp_href
 */
export async function createRemote(
  api: PulpAPIClient,
  overrides?: Partial<PulpRemote>
): Promise<PulpRemote> {
  remoteCounter++
  const name = generateUniqueName('remote', remoteCounter)

  const body = {
    name,
    url: 'https://fixtures.pulpproject.org/file/',
    ...overrides,
  }

  const response = await api.post<PulpRemote | PulpTaskResponse>('/remotes/file/file/', body)

  // If response is a task, wait for it to complete
  if (isTaskResponse(response)) {
    return waitForTaskAndGetResource<PulpRemote>(api, response.task, 'Remote')
  }

  return response
}

/**
 * Create a Pulp file distribution
 * @param api - PulpAPIClient instance
 * @param overrides - Optional partial distribution data to override defaults
 * @returns The created distribution with pulp_href
 */
export async function createDistribution(
  api: PulpAPIClient,
  overrides?: Partial<PulpDistribution>
): Promise<PulpDistribution> {
  distributionCounter++
  const name = generateUniqueName('dist', distributionCounter)
  // Use name as base_path to ensure uniqueness
  const base_path = overrides?.base_path ?? name

  const body = {
    name,
    base_path,
    ...overrides,
  }

  const response = await api.post<PulpDistribution | PulpTaskResponse>('/distributions/file/file/', body)

  // If response is a task, wait for it to complete
  if (isTaskResponse(response)) {
    return waitForTaskAndGetResource<PulpDistribution>(api, response.task, 'Distribution')
  }

  return response
}
