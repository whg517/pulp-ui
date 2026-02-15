import { Page, Route } from '@playwright/test'
import {
  createMockRepository,
  createMockRemote,
  createMockDistribution,
  createMockTask,
  createMockContent,
  mockStatus,
  paginated,
} from '../../src/test/mocks/data'

// Route handlers
export async function handleStatus(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockStatus),
  })
}

export async function handleRepositories(route: Route) {
  const repos = [createMockRepository(1), createMockRepository(2)]
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(paginated(repos)),
  })
}

export async function handleRepository(route: Route, id: string) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(createMockRepository(parseInt(id))),
  })
}

export async function handleRemotes(route: Route) {
  const remotes = [createMockRemote(1), createMockRemote(2)]
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(paginated(remotes)),
  })
}

export async function handleRemote(route: Route, id: string) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(createMockRemote(parseInt(id))),
  })
}

export async function handleDistributions(route: Route) {
  const distributions = [createMockDistribution(1), createMockDistribution(2)]
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(paginated(distributions)),
  })
}

export async function handleDistribution(route: Route, id: string) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(createMockDistribution(parseInt(id))),
  })
}

export async function handleTasks(route: Route) {
  const tasks = [
    createMockTask(1, 'completed'),
    createMockTask(2, 'running'),
    createMockTask(3, 'failed'),
  ]
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(paginated(tasks)),
  })
}

export async function handleTask(route: Route, id: string) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(createMockTask(parseInt(id))),
  })
}

export async function handleContent(route: Route) {
  const contents = [createMockContent(1), createMockContent(2)]
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(paginated(contents)),
  })
}

// Setup all mock routes
export async function setupApiMocks(page: Page) {
  // Status endpoint - match with or without query params
  await page.route('**/pulp/api/v3/status/**', handleStatus)

  // Repositories - match list endpoint (with query params)
  await page.route(/.*\/pulp\/api\/v3\/repositories\/(\?.*)?$/, handleRepositories)
  // Individual repository
  await page.route(/.*\/pulp\/api\/v3\/repositories\/(\d+)\/(\?.*)?$/, async (route) => {
    const match = route.request().url().match(/repositories\/(\d+)\//)
    if (match) {
      await handleRepository(route, match[1])
    } else {
      await route.continue()
    }
  })

  // Remotes - match list endpoint (with query params)
  await page.route(/.*\/pulp\/api\/v3\/remotes\/(\?.*)?$/, handleRemotes)
  // Individual remote
  await page.route(/.*\/pulp\/api\/v3\/remotes\/(\d+)\/(\?.*)?$/, async (route) => {
    const match = route.request().url().match(/remotes\/(\d+)\//)
    if (match) {
      await handleRemote(route, match[1])
    } else {
      await route.continue()
    }
  })

  // Distributions - match list endpoint (with query params)
  await page.route(/.*\/pulp\/api\/v3\/distributions\/(\?.*)?$/, handleDistributions)
  // Individual distribution
  await page.route(/.*\/pulp\/api\/v3\/distributions\/(\d+)\/(\?.*)?$/, async (route) => {
    const match = route.request().url().match(/distributions\/(\d+)\//)
    if (match) {
      await handleDistribution(route, match[1])
    } else {
      await route.continue()
    }
  })

  // Tasks - match list endpoint (with query params)
  await page.route(/.*\/pulp\/api\/v3\/tasks\/(\?.*)?$/, handleTasks)
  // Individual task
  await page.route(/.*\/pulp\/api\/v3\/tasks\/(\d+)\/(\?.*)?$/, async (route) => {
    const match = route.request().url().match(/tasks\/(\d+)\//)
    if (match) {
      await handleTask(route, match[1])
    } else {
      await route.continue()
    }
  })

  // Content - match list endpoint (with query params)
  await page.route(/.*\/pulp\/api\/v3\/content\/(\?.*)?$/, handleContent)

  // Sync repository - return a running task
  await page.route('**/pulp/api/v3/repositories/*/sync/**', async (route) => {
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify(createMockTask(Date.now(), 'running')),
    })
  })
}

// Clear all mock routes
export async function clearApiMocks(page: Page) {
  await page.unrouteAll()
}
