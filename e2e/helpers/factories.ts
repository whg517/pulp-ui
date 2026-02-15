import type { PulpRepository, PulpRemote, PulpDistribution } from '../../src/types/pulp'
import type { PulpAPIClient } from './api'

// Module-level counters for unique name generation
let repositoryCounter = 0
let remoteCounter = 0
let distributionCounter = 0

/**
 * Generate a unique name for test entities
 * Format: test-{entityType}-{timestamp}-{counter}
 */
function generateUniqueName(entityType: string, counter: number): string {
  return `test-${entityType}-${Date.now()}-${counter}`
}

/**
 * Create a Pulp repository
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

  return api.post<PulpRepository>('/repositories/', body)
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

  return api.post<PulpRemote>('/remotes/file/file/', body)
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

  return api.post<PulpDistribution>('/distributions/file/file/', body)
}
