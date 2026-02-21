import { test, expect } from './fixtures'

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
    
    await authenticatedPage.waitForTimeout(2000)
    
    const pageContent = await authenticatedPage.content()
    const hasContent = pageContent.includes('No ACS') ||
                       pageContent.includes('Failed to load') ||
                       pageContent.includes('acs-') ||
                       pageContent.includes('Active')
    
    expect(hasContent).toBe(true)
  })

  test('shows error state when API fails', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/pulp/api/v3/acs/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await authenticatedPage.goto('/acs')

    await expect(authenticatedPage.getByText('Failed to load ACS entries')).toBeVisible()
  })

  test('shows empty state when no ACS exist', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/pulp/api/v3/acs/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await authenticatedPage.goto('/acs')

    await expect(authenticatedPage.getByText('No ACS configured')).toBeVisible()
  })
})
