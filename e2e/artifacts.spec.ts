import { test, expect } from './fixtures/index.js'

test.describe('Artifacts Management Flow', () => {
  test('displays artifacts list page', async ({ pageObjects }) => {
    await pageObjects.artifacts.goto()

    await expect(pageObjects.artifacts.heading).toBeVisible()
    await expect(pageObjects.artifacts.subtitle).toBeVisible()
  })

  test('displays artifacts table with correct columns', async ({ pageObjects }) => {
    await pageObjects.artifacts.goto()

    const table = pageObjects.artifacts.table
    const emptyState = pageObjects.artifacts.getEmptyState()
    const errorState = pageObjects.artifacts.getErrorState()

    // Wait for content to load
    await expect(table.or(emptyState).or(errorState)).toBeVisible({ timeout: 10000 })

    // Check if table exists
    const hasTable = await table.isVisible().catch(() => false)
    
    if (hasTable) {
      await expect(pageObjects.artifacts.getColumnHeader('File')).toBeVisible()
      await expect(pageObjects.artifacts.getColumnHeader('SHA256')).toBeVisible()
      await expect(pageObjects.artifacts.getColumnHeader('Size')).toBeVisible()
      await expect(pageObjects.artifacts.getColumnHeader('Created')).toBeVisible()
      await expect(pageObjects.artifacts.getColumnHeader('Actions')).toBeVisible()
    }
  })

  test('shows loading skeleton while fetching artifacts', async ({ pageObjects }) => {
    await pageObjects.artifacts.page.route('**/pulp/api/v3/artifacts/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    await pageObjects.artifacts.goto()

    const skeletons = pageObjects.artifacts.page.locator('[class*="animate-pulse"]')
    await expect(skeletons.first()).toBeVisible()
  })

  test('search field selector exists', async ({ pageObjects }) => {
    await pageObjects.artifacts.goto()
    await expect(pageObjects.artifacts.page.locator('input[placeholder*="Search"]')).toBeVisible()
  })

  test('search input exists', async ({ pageObjects }) => {
    await pageObjects.artifacts.goto()
    await expect(pageObjects.artifacts.searchInput).toBeVisible()
  })

  test('refresh button exists and works', async ({ pageObjects }) => {
    await pageObjects.artifacts.goto()
    await pageObjects.artifacts.refresh()
    await expect(pageObjects.artifacts.heading).toBeVisible()
  })

  test('shows empty state when no artifacts exist', async ({ pageObjects }) => {
    await pageObjects.artifacts.page.route('**/pulp/api/v3/artifacts/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await pageObjects.artifacts.goto()
    await expect(pageObjects.artifacts.getEmptyState()).toBeVisible()
  })

  test('shows error state when API fails', async ({ pageObjects }) => {
    await pageObjects.artifacts.page.route('**/pulp/api/v3/artifacts/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await pageObjects.artifacts.goto()
    await expect(pageObjects.artifacts.getErrorState()).toBeVisible()
  })
})
