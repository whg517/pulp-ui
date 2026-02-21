import { test, expect } from './fixtures'

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
    
    // Wait for loading to complete - either show guards, empty state, or error
    await authenticatedPage.waitForTimeout(2000)
    
    const pageContent = await authenticatedPage.content()
    const hasContent = pageContent.includes('No content guards') ||
                       pageContent.includes('Failed to load') ||
                       pageContent.includes('Certificate') ||
                       pageContent.includes('RBAC')
    
    expect(hasContent).toBe(true)
  })

  test('shows error state when API fails', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/pulp/api/v3/contentguards/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await authenticatedPage.goto('/content-guards')

    await expect(authenticatedPage.getByText('Failed to load content guards')).toBeVisible()
  })

  test('shows empty state when no guards exist', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/pulp/api/v3/contentguards/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await authenticatedPage.goto('/content-guards')

    await expect(authenticatedPage.getByText('No content guards found')).toBeVisible()
  })
})
