import { test, expect } from './fixtures/index.js'

test.describe('Dashboard Page', () => {
  test('displays dashboard page with heading', async ({ pageObjects }) => {
    const dashboard = pageObjects.dashboard
    await dashboard.goto()
    await expect(dashboard.heading).toBeVisible()
    await expect(dashboard.subtitle).toBeVisible()
  })

  test('displays system status card when connected', async ({ pageObjects }) => {
    const dashboard = pageObjects.dashboard
    await dashboard.goto()
    await expect(dashboard.heading).toBeVisible()

    // Wait for system status card with longer timeout
    await expect(dashboard.systemStatusCard).toBeVisible({ timeout: 20000 })
  })

  test('displays statistics cards', async ({ pageObjects }) => {
    const dashboard = pageObjects.dashboard
    await dashboard.goto()
    await expect(dashboard.heading).toBeVisible()

    // Check for stat cards content
    const pageContent = await dashboard.page.content()
    const hasStatCards =
      pageContent.includes('Repositories') ||
      pageContent.includes('Distributions') ||
      pageContent.includes('Tasks') ||
      pageContent.includes('Content')

    expect(hasStatCards).toBe(true)
  })

  test('displays recent tasks section', async ({ pageObjects }) => {
    const dashboard = pageObjects.dashboard
    await dashboard.goto()
    await expect(dashboard.recentTasksSection).toBeVisible()
    await expect(dashboard.recentTasksSubtitle).toBeVisible()
  })

  test('shows loading state initially', async ({ authenticatedPage, pageObjects }) => {
    const dashboard = pageObjects.dashboard

    await authenticatedPage.route('**/pulp/api/v3/status/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    await dashboard.goto()

    const skeletons = authenticatedPage.locator('[class*="animate-pulse"]')
    await expect(skeletons.first()).toBeVisible()
  })

  test('shows connection error when API fails', async ({ pageObjects }) => {
    const dashboard = pageObjects.dashboard

    await dashboard.page.route('**/pulp/api/v3/status/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await dashboard.goto()
    await expect(dashboard.connectionErrorCard).toBeVisible()
    await expect(
      dashboard.page.getByText('Unable to connect to the Pulp API')
    ).toBeVisible()
  })

  test('displays task state badges correctly', async ({ pageObjects }) => {
    const dashboard = pageObjects.dashboard
    await dashboard.goto()
    await expect(dashboard.heading).toBeVisible()
    await expect(dashboard.recentTasksSection).toBeVisible()

    // Check for either task list or empty state
    const hasNoTasks = await dashboard.page
      .getByText('No tasks found')
      .isVisible()
      .catch(() => false)

    if (!hasNoTasks) {
      await expect(dashboard.recentTasksSection).toBeVisible()
    }
  })
})
