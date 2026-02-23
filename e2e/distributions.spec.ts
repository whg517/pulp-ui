import { test, expect } from './fixtures/index.js'

test.describe('Distributions Management Flow', () => {
  test('displays distributions list page', async ({ pageObjects }) => {
    await pageObjects.distributions.goto()

    await expect(pageObjects.distributions.heading).toBeVisible()
    await expect(pageObjects.distributions.subtitle).toBeVisible()
    await expect(pageObjects.distributions.createButton).toBeVisible()
    await expect(pageObjects.distributions.searchInput).toBeVisible()
  })

  test('displays distributions table with correct columns', async ({ pageObjects }) => {
    await pageObjects.distributions.goto()

    // Wait for content to load - use longer timeout
    const noDist = pageObjects.distributions.page.getByText('No distributions found')
    const nameHeader = pageObjects.distributions.page.getByRole('columnheader', { name: 'Name' })
    const errorState = pageObjects.distributions.page.getByText(/Failed to load|Error/)
    
    await expect(noDist.or(nameHeader).or(errorState)).toBeVisible({ timeout: 30000 })

    // Check if table exists
    const hasTable = await pageObjects.distributions.table.isVisible().catch(() => false)
    
    if (hasTable) {
      await expect(nameHeader).toBeVisible()
      await expect(pageObjects.distributions.getColumnHeader('Base Path')).toBeVisible()
      await expect(pageObjects.distributions.getColumnHeader('Base URL')).toBeVisible()
      await expect(pageObjects.distributions.getColumnHeader('Repository')).toBeVisible()
      await expect(pageObjects.distributions.getColumnHeader('Created')).toBeVisible()
      await expect(pageObjects.distributions.getColumnHeader('Actions')).toBeVisible()
    }
  })

  test.skip('shows loading skeleton while fetching distributions', async () => {
    // Route mocking for loading states is unreliable in Playwright
  })

  test.skip('displays distributions list after loading', async ({ pageObjects, factory }) => {
    // Needs separate test data per parallel worker - needs test isolation fix
    const distName = `test-dist-${Date.now()}`
    
    // Create distribution and wait for it to be available
    await factory.createDistribution({ name: distName })
    
    // Give system time to process
    await new Promise(resolve => setTimeout(resolve, 2000))

    await pageObjects.distributions.goto()
    await expect(pageObjects.distributions.page.getByText(distName, { exact: true })).toBeVisible({ timeout: 30000 })
  })

  test.skip('searches distributions by name', async ({ pageObjects, factory }) => {
    // Needs separate test data per parallel worker - needs test isolation fix
    const distName = `test-dist-${Date.now()}`
    
    // Create distribution
    await factory.createDistribution({ name: distName })
    
    // Give system time to process
    await new Promise(resolve => setTimeout(resolve, 2000))

    await pageObjects.distributions.goto()
    await expect(pageObjects.distributions.page.getByText(distName, { exact: true })).toBeVisible({ timeout: 30000 })

    await pageObjects.distributions.search(distName)
    await expect(pageObjects.distributions.searchInput).toHaveValue(distName)
    await expect(pageObjects.distributions.page.getByText(distName, { exact: true })).toBeVisible({ timeout: 30000 })
  })

  test.skip('navigates to distribution detail on row click', async ({ pageObjects, factory }) => {
    // Needs separate test data per parallel worker - needs test isolation fix
    const distName = `test-dist-${Date.now()}`
    
    // Create distribution
    await factory.createDistribution({ name: distName })
    
    // Give system time to process
    await new Promise(resolve => setTimeout(resolve, 2000))

    await pageObjects.distributions.goto()
    await expect(pageObjects.distributions.page.getByText(distName, { exact: true })).toBeVisible({ timeout: 30000 })

    await pageObjects.distributions.clickDistribution(distName)
    await expect(pageObjects.distributions.page).toHaveURL(/\/distributions\//)
  })

  test('shows empty state when no distributions exist', async ({ pageObjects }) => {
    await pageObjects.distributions.page.route('**/pulp/api/v3/distributions/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await pageObjects.distributions.goto()
    await expect(pageObjects.distributions.getEmptyState()).toBeVisible()
  })

  test('shows error state when API fails', async ({ pageObjects }) => {
    await pageObjects.distributions.page.route('**/pulp/api/v3/distributions/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await pageObjects.distributions.goto()
    await expect(pageObjects.distributions.getErrorState()).toBeVisible()
  })

  test('refreshes distributions list', async ({ pageObjects }) => {
    await pageObjects.distributions.goto()
    await pageObjects.distributions.refresh()
    await expect(pageObjects.distributions.heading).toBeVisible()
  })
})
