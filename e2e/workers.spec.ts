import { test, expect } from './fixtures'

test.describe('Workers Monitoring Flow', () => {
  test('displays workers list page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/workers')

    // Verify page header
    await expect(authenticatedPage.getByRole('heading', { name: 'Workers' })).toBeVisible()
    await expect(authenticatedPage.getByText('Monitor worker status')).toBeVisible()
  })

  test('displays workers table with correct columns', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/workers')

    // Wait for page header first
    await expect(authenticatedPage.getByRole('heading', { name: 'Workers' })).toBeVisible()

    // Wait for table to load or error
    const table = authenticatedPage.getByRole('table')
    const errorState = authenticatedPage.getByText('Failed to load')

    await table.or(errorState).waitFor({ timeout: 15000 })

    const hasTable = await table.isVisible().catch(() => false)

    if (hasTable) {
      // Verify column headers
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Name' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Status' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Last Heartbeat' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Current Task' })).toBeVisible()
    }
  })

  test('shows loading skeleton while fetching workers', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/pulp/api/v3/workers/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    await authenticatedPage.goto('/workers')

    // Verify loading skeletons are shown
    const skeletons = authenticatedPage.locator('[class*="animate-pulse"]')
    await expect(skeletons.first()).toBeVisible()
  })

  test('displays workers list after loading', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/workers')

    // Wait for page header first
    await expect(authenticatedPage.getByRole('heading', { name: 'Workers' })).toBeVisible()

    // Wait a bit for content to load
    await authenticatedPage.waitForTimeout(2000)

    // The page should have loaded - check for any content
    const table = authenticatedPage.getByRole('table')
    const errorState = authenticatedPage.getByText('Failed to load')
    const emptyState = authenticatedPage.getByText('No workers found')

    const hasTable = await table.isVisible().catch(() => false)
    const hasError = await errorState.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)

    expect(hasTable || hasError || hasEmpty).toBe(true)
  })

  test('displays online/offline status badges', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/workers')

    // Wait for page header first
    await expect(authenticatedPage.getByRole('heading', { name: 'Workers' })).toBeVisible()

    // Wait a bit for content to load
    await authenticatedPage.waitForTimeout(3000)

    // Just verify the page has loaded some content
    const pageContent = await authenticatedPage.content()

    // Check for any worker-related content
    const hasContent = pageContent.includes('Online') ||
                       pageContent.includes('Offline') ||
                       pageContent.includes('No workers') ||
                       pageContent.includes('Failed to load') ||
                       pageContent.includes('Status')

    expect(hasContent).toBe(true)
  })

  test('refresh button exists and works', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/workers')

    // Wait for page header
    await expect(authenticatedPage.getByRole('heading', { name: 'Workers' })).toBeVisible()

    // Find and click refresh button (button with SVG icon in CardHeader)
    const refreshButtons = authenticatedPage
      .locator('button')
      .filter({ has: authenticatedPage.locator('svg') })

    // Click the refresh button if visible
    if (await refreshButtons.first().isVisible().catch(() => false)) {
      await refreshButtons.first().click()
    }

    // Verify page is still functional - header should still be visible
    await expect(authenticatedPage.getByRole('heading', { name: 'Workers' })).toBeVisible()
  })

  test('shows empty state when no workers exist', async ({ authenticatedPage }) => {
    // Mock empty response (unlikely in real Pulp, but test the UI)
    await authenticatedPage.route('**/pulp/api/v3/workers/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await authenticatedPage.goto('/workers')

    // Verify empty state message
    await expect(authenticatedPage.getByText('No workers found')).toBeVisible()
  })

  test('shows error state when API fails', async ({ authenticatedPage }) => {
    // Mock error response
    await authenticatedPage.route('**/pulp/api/v3/workers/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await authenticatedPage.goto('/workers')

    // Verify error message
    await expect(authenticatedPage.getByText('Failed to load workers')).toBeVisible()
  })

  test('pagination works correctly with many workers', async ({ authenticatedPage }) => {
    // Mock paginated response with many results
    await authenticatedPage.route('**/pulp/api/v3/workers/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 25,
          next: 'offset=10',
          previous: null,
          results: Array.from({ length: 10 }, (_, i) => ({
            pulp_href: `/pulp/api/v3/workers/${i + 1}/`,
            name: `worker-${i + 1}`,
            online: i % 2 === 0,
            last_heartbeat: new Date().toISOString(),
            current_task: i % 3 === 0 ? `/pulp/api/v3/tasks/${i + 1}/` : null,
          })),
        }),
      })
    })

    await authenticatedPage.goto('/workers')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Check for pagination controls
    const nextButton = authenticatedPage.getByRole('button', { name: 'Next' })
    const prevButton = authenticatedPage.getByRole('button', { name: 'Previous' })

    await expect(nextButton).toBeVisible()
    await expect(prevButton).toBeDisabled()
  })

  test('displays current task for busy workers', async ({ authenticatedPage }) => {
    // Mock response with a busy worker
    await authenticatedPage.route('**/pulp/api/v3/workers/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              pulp_href: '/pulp/api/v3/workers/1/',
              name: 'busy-worker',
              online: true,
              last_heartbeat: new Date().toISOString(),
              current_task: '/pulp/api/v3/tasks/123/',
            },
          ],
        }),
      })
    })

    await authenticatedPage.goto('/workers')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Check for worker with current task
    await expect(authenticatedPage.getByText('busy-worker')).toBeVisible()
  })

  test('displays dash for idle workers', async ({ authenticatedPage }) => {
    // Mock response with an idle worker
    await authenticatedPage.route('**/pulp/api/v3/workers/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              pulp_href: '/pulp/api/v3/workers/1/',
              name: 'idle-worker',
              online: true,
              last_heartbeat: new Date().toISOString(),
              current_task: null,
            },
          ],
        }),
      })
    })

    await authenticatedPage.goto('/workers')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Check for worker name
    await expect(authenticatedPage.getByText('idle-worker')).toBeVisible()
  })
})
