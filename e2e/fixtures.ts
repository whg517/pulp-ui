import { test as base, type Page } from '@playwright/test'
import { PulpAPIClient, createAPIClient } from './helpers/api'
import { createRepository, createRemote, createDistribution } from './helpers/factories'
import { cleanupManager, CleanupManager } from './helpers/cleanup'
import { loginViaUI } from './helpers/auth'
import type { PulpRepository, PulpRemote, PulpDistribution } from '../src/types/pulp'

/**
 * TestFactory wraps factory functions with auto-registration for cleanup.
 * Entities created through this class are automatically tracked for cleanup.
 */
export class TestFactory {
  constructor(
    private readonly api: PulpAPIClient,
    private readonly cleanup: CleanupManager
  ) {}

  /**
   * Create a repository and register it for cleanup
   */
  async createRepository(overrides?: Partial<PulpRepository>): Promise<PulpRepository> {
    const repo = await createRepository(this.api, overrides)
    this.cleanup.register('repository', repo.pulp_href)
    return repo
  }

  /**
   * Create a remote and register it for cleanup
   */
  async createRemote(overrides?: Partial<PulpRemote>): Promise<PulpRemote> {
    const remote = await createRemote(this.api, overrides)
    this.cleanup.register('remote', remote.pulp_href)
    return remote
  }

  /**
   * Create a distribution and register it for cleanup
   */
  async createDistribution(overrides?: Partial<PulpDistribution>): Promise<PulpDistribution> {
    const dist = await createDistribution(this.api, overrides)
    this.cleanup.register('distribution', dist.pulp_href)
    return dist
  }
}

/**
 * Custom fixtures for Pulp E2E tests
 */
export const test = base.extend<{
  /** Pulp API client for making REST API requests */
  api: PulpAPIClient
  /** Test factory for creating entities with auto-cleanup */
  factory: TestFactory
  /** Cleanup manager for tracking and deleting test entities */
  cleanup: CleanupManager
  /** Pre-authenticated page (logs in via UI before test) */
  authenticatedPage: Page
}>({
  api: async ({ request }, use) => {
    const client = createAPIClient(request)
    cleanupManager.setApiClient(client)
    await use(client)
  },

  factory: async ({ api }, use) => {
    const factory = new TestFactory(api, cleanupManager)
    await use(factory)
  },

  cleanup: async ({}, use) => {
    await use(cleanupManager)
    await cleanupManager.cleanupAll()
  },

  authenticatedPage: async ({ page }, use) => {
    await loginViaUI(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'
