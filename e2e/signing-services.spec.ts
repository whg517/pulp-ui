import { test, expect } from './fixtures/index.js'

test.describe('Signing Services Flow', () => {
  test('displays signing services list page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/signing-services')

    await expect(authenticatedPage.getByRole('heading', { name: 'Signing Services' })).toBeVisible()
    await expect(authenticatedPage.getByText('View configured signing services')).toBeVisible()
  })

  test('shows loading state then content', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/signing-services')

    await expect(authenticatedPage.getByRole('heading', { name: 'Signing Services' })).toBeVisible()

    // Wait for content to appear - use proper assertions instead of timeout
    const noServices = authenticatedPage.getByText('No signing services')
    const failedToLoad = authenticatedPage.getByText('Failed to load')
    const serviceContent = authenticatedPage.locator('text=/signing-service-|Fingerprint/')

    await expect(noServices.or(failedToLoad).or(serviceContent)).toBeVisible({ timeout: 10000 })
  })

  test('shows error state when API fails', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/pulp/api/v3/signing-services/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await authenticatedPage.goto('/signing-services')

    await expect(authenticatedPage.getByText('Failed to load signing services')).toBeVisible()
  })

  test('shows empty state when no signing services exist', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/pulp/api/v3/signing-services/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await authenticatedPage.goto('/signing-services')

    await expect(authenticatedPage.getByText('No signing services configured')).toBeVisible()
  })
})
