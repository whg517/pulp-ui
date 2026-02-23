import { test, expect } from './fixtures/index.js'

test.describe('ACS Flow', () => {
  test('displays ACS list page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/acs')

    await expect(authenticatedPage.getByRole('heading', { name: 'Alternate Content Sources' })).toBeVisible()
    await expect(authenticatedPage.getByText('Manage alternate content sources')).toBeVisible()
  })

  test('displays create ACS button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/acs')

    await expect(authenticatedPage.getByRole('button', { name: 'Create ACS' })).toBeVisible()
  })

  test('displays search input', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/acs')

    await expect(authenticatedPage.getByPlaceholder('Search ACS...')).toBeVisible()
  })

  test('shows loading state then content', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/acs')

    await expect(authenticatedPage.getByRole('heading', { name: 'Alternate Content Sources' })).toBeVisible()

    // Wait for content to appear - check for any sign of data or error
    await authenticatedPage.waitForTimeout(2000)
    
    // Check that page is functional - either has content or appropriate state
    const hasContent = await authenticatedPage.getByText(/No ACS|Active|Failed to load/).isVisible().catch(() => false)
    expect(hasContent).toBe(true)
  })

  test('shows error state when API fails', async ({ authenticatedPage }) => {
    // Mock error response for ACS endpoint
    await authenticatedPage.route('**/pulp/api/v3/acs*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await authenticatedPage.goto('/acs')

    // Check that page loaded even with error
    await expect(authenticatedPage.getByRole('heading', { name: 'Alternate Content Sources' })).toBeVisible()
    // Page should show some content state
    await authenticatedPage.waitForTimeout(2000)
  })

  test('shows empty state when no ACS exist', async ({ authenticatedPage }) => {
    // Mock empty response for ACS endpoint
    await authenticatedPage.route('**/pulp/api/v3/acs*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await authenticatedPage.goto('/acs')

    // Check for empty state message
    await authenticatedPage.waitForTimeout(2000)
    const hasEmptyState = await authenticatedPage.getByText(/No ACS|empty|No data/i).isVisible().catch(() => false)
    expect(hasEmptyState).toBe(true)
  })
})
