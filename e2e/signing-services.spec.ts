import { test, expect } from './fixtures'

test.describe('Signing Services Flow', () => {
  test('displays signing services list page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/signing-services')

    await expect(authenticatedPage.getByRole('heading', { name: 'Signing Services' })).toBeVisible()
    await expect(authenticatedPage.getByText('View configured signing services')).toBeVisible()
  })

  test('shows loading state then content', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/signing-services')

    await expect(authenticatedPage.getByRole('heading', { name: 'Signing Services' })).toBeVisible()
    
    await authenticatedPage.waitForTimeout(2000)
    
    const pageContent = await authenticatedPage.content()
    const hasContent = pageContent.includes('No signing services') ||
                       pageContent.includes('Failed to load') ||
                       pageContent.includes('signing-service-') ||
                       pageContent.includes('Fingerprint')
    
    expect(hasContent).toBe(true)
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
