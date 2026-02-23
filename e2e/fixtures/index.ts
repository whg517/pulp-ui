import { test as base, type Page } from '@playwright/test'
import { PulpAPIClient, createAPIClient } from '../helpers/api.js'
import { createRepository, createRemote, createDistribution } from '../helpers/factories.js'
import { cleanupManager, CleanupManager } from '../helpers/cleanup.js'
import { PageObjects } from '../pages/index.js'
import type { PulpRepository, PulpRemote, PulpDistribution } from '../../src/types/pulp.js'

export class TestFactory {
  constructor(
    private readonly api: PulpAPIClient,
    private readonly cleanup: CleanupManager
  ) {}

  async createRepository(overrides?: Partial<PulpRepository>): Promise<PulpRepository> {
    const repo = await createRepository(this.api, overrides)
    this.cleanup.register('repository', repo.pulp_href)
    return repo
  }

  async createRemote(overrides?: Partial<PulpRemote>): Promise<PulpRemote> {
    const remote = await createRemote(this.api, overrides)
    this.cleanup.register('remote', remote.pulp_href)
    return remote
  }

  async createDistribution(overrides?: Partial<PulpDistribution>): Promise<PulpDistribution> {
    const dist = await createDistribution(this.api, overrides)
    this.cleanup.register('distribution', dist.pulp_href)
    return dist
  }
}

// Generate unique prefix for each test to avoid parallel execution conflicts
const getTestPrefix = () => `t${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

export const test = base.extend<{
  api: PulpAPIClient
  factory: TestFactory
  cleanup: CleanupManager
  authenticatedPage: Page
  pageObjects: PageObjects
  testPrefix: string
}>({
  api: async ({ request }, use) => {
    const client = createAPIClient(request)
    cleanupManager.setApiClient(client)
    await use(client)
  },

  testPrefix: async ({}, use) => {
    await use(getTestPrefix())
  },

  factory: async ({ api, testPrefix }, use) => {
    const factory = new TestFactory(api, cleanupManager)
    await use(factory)
  },

  cleanup: async ({}, use) => {
    await use(cleanupManager)
    await cleanupManager.cleanupAll()
  },

  authenticatedPage: async ({ page }, use) => {
    const storageStatePath = '.auth/admin.json'
    const fs = await import('fs')
    const storageState = JSON.parse(fs.readFileSync(storageStatePath, 'utf-8'))

    const localStorageItems: { name: string; value: string }[] = []
    for (const origin of storageState.origins || []) {
      for (const item of origin.localStorage || []) {
        localStorageItems.push(item)
      }
    }

    await page.addInitScript((items) => {
      for (const { name, value } of items) {
        localStorage.setItem(name, value)
      }
    }, localStorageItems)

    await page.goto('/')
    await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 })
    await use(page)
  },

  pageObjects: async ({ authenticatedPage }, use) => {
    const pages = new PageObjects(authenticatedPage)
    await use(pages)
  },
})

export { expect } from '@playwright/test'
