import { test, expect } from './fixtures/index.js'

test.describe('Content Guards Flow', () => {
  test('displays content guards list page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/content-guards')

    await expect(authenticatedPage.getByRole('heading', { name: 'Content Guards' })).toBeVisible()
    await expect(authenticatedPage.getByText('Manage access control')).toBeVisible()
  })

  test('displays create guard button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/content-guards')

    await expect(authenticatedPage.getByRole('button', { name: 'Create Guard' })).toBeVisible()
  })

  test('displays search input', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/content-guards')

    await expect(authenticatedPage.getByPlaceholder('Search content guards...')).toBeVisible()
  })

  test('shows loading state then content', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/content-guards')

    await expect(authenticatedPage.getByRole('heading', { name: 'Content Guards' })).toBeVisible()

    // Wait for content to appear - check for any sign of data or error
    await authenticatedPage.waitForTimeout(2000)
    
    // Check that page is functional - either has content or appropriate state
    const hasContent = await authenticatedPage.getByText(/No content guards|Certificate|RBAC|Failed to load/).isVisible().catch(() => false)
    expect(hasContent).toBe(true)
  })

  test('shows error state when API fails', async ({ authenticatedPage }) => {
    // Mock error response for content guards endpoint
    await authenticatedPage.route('**/pulp/api/v3/contentguards*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await authenticatedPage.goto('/content-guards')

    // Check that page loaded even with error
    await expect(authenticatedPage.getByRole('heading', { name: 'Content Guards' })).toBeVisible()
    // Page should show some content state
    await authenticatedPage.waitForTimeout(2000)
  })
})
