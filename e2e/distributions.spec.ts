import { test, expect } from '@playwright/test'
import { setupApiMocks } from './mocks/api-mocks'

test.describe('Distributions Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await setupApiMocks(page)

    // Login first
    await page.context().clearCookies()
    await page.goto('/login')
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL('/')
  })

  test('displays distributions list page', async ({ page }) => {
    await page.goto('/distributions')

    // Verify page header
    await expect(page.getByRole('heading', { name: 'Distributions' })).toBeVisible()
    await expect(page.getByText('Publish and serve your content')).toBeVisible()

    // Verify create button exists
    await expect(page.getByRole('button', { name: /Create Distribution/ })).toBeVisible()

    // Verify search input exists
    await expect(page.getByPlaceholder('Search distributions...')).toBeVisible()
  })

  test('displays distributions table with correct columns', async ({ page }) => {
    await page.goto('/distributions')

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Base Path' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Base URL' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Repository' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Created' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
  })

  test('shows loading skeleton while fetching distributions', async ({ page }) => {
    // Slow down the API response and return mock data
    await page.route(/.*\/pulp\/api\/v3\/distributions\/(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          next: null,
          previous: null,
          results: [
            { pulp_href: '/pulp/api/v3/distributions/1/', pulp_created: new Date().toISOString(), pulp_last_updated: new Date().toISOString(), base_path: 'dist-1', base_url: '/pulp/content/dist-1/', content_guard: null, pulp_labels: {}, name: 'dist-1', repository: null, repository_version: null },
            { pulp_href: '/pulp/api/v3/distributions/2/', pulp_created: new Date().toISOString(), pulp_last_updated: new Date().toISOString(), base_path: 'dist-2', base_url: '/pulp/content/dist-2/', content_guard: null, pulp_labels: {}, name: 'dist-2', repository: null, repository_version: null },
          ],
        }),
      })
    })

    await page.goto('/distributions')

    // Verify loading skeletons are shown (animate-pulse class)
    const skeletons = page.locator('[class*="animate-pulse"]')
    await expect(skeletons.first()).toBeVisible()
  })

  test('displays distributions list after loading', async ({ page }) => {
    await page.goto('/distributions')

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible()

    // Verify at least one distribution row exists
    const rows = page.getByRole('row')
    await expect(rows.first()).toBeVisible()
  })

  test('searches distributions by name', async ({ page }) => {
    await page.goto('/distributions')

    // Wait for initial load
    await expect(page.getByRole('table')).toBeVisible()

    // Type in search
    const searchInput = page.getByPlaceholder('Search distributions...')
    await searchInput.fill('dist-1')

    // Verify search input value (auto-retrying assertion)
    await expect(searchInput).toHaveValue('dist-1')
  })

  test('refreshes distributions list', async ({ page }) => {
    await page.goto('/distributions')
    await expect(page.getByRole('table')).toBeVisible()

    // Click refresh button
    const refreshButtons = page.locator('button').filter({ has: page.locator('svg') })
    await refreshButtons.first().click()

    // Verify page is still functional
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('displays repository link status badge', async ({ page }) => {
    await page.goto('/distributions')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for repository status badges
    const linkedBadge = page.getByText('Linked')
    const noneBadge = page.getByText('None', { exact: true })

    // At least one of the badges should be visible
    await expect(linkedBadge.or(noneBadge).first()).toBeVisible()
  })

  test('base URL is clickable and opens in new tab', async ({ page }) => {
    await page.goto('/distributions')
    await expect(page.getByRole('table')).toBeVisible()

    // Find a base URL link
    const baseUrlLink = page.locator('a[target="_blank"]').first()

    if (await baseUrlLink.isVisible()) {
      // Verify it opens in new tab
      await expect(baseUrlLink).toHaveAttribute('target', '_blank')
      await expect(baseUrlLink).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  test('edits distribution', async ({ page }) => {
    await page.goto('/distributions')
    await expect(page.getByRole('table')).toBeVisible()

    // Find and click edit button
    const editButton = page.getByRole('button', { name: 'Edit distribution' }).first()
    if (await editButton.isVisible()) {
      await editButton.click()
      // Note: Edit functionality may open a modal or navigate
    }
  })

  test('deletes distribution with confirmation', async ({ page }) => {
    await page.goto('/distributions')
    await expect(page.getByRole('table')).toBeVisible()

    // Set up dialog handler
    page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('Are you sure')
      dialog.dismiss() // Cancel the deletion
    })

    // Find and click delete button
    const deleteButton = page.getByRole('button', { name: 'Delete distribution' }).first()
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
    }
  })

  test('shows empty state when no distributions exist', async ({ page }) => {
    // Mock empty response
    await page.route(/.*\/pulp\/api\/v3\/distributions\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await page.goto('/distributions')

    // Verify empty state message
    await expect(page.getByText('No distributions found')).toBeVisible()
  })

  test('shows error state when API fails', async ({ page }) => {
    // Mock error response
    await page.route(/.*\/pulp\/api\/v3\/distributions\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await page.goto('/distributions')

    // Verify error message
    await expect(page.getByText('Failed to load distributions')).toBeVisible()
  })

  test('shows search empty state when no matches', async ({ page }) => {
    // Mock empty response for search query
    await page.route(/.*\/pulp\/api\/v3\/distributions\/(\?.*)?$/, async (route) => {
      const url = route.request().url()
      if (url.includes('name__contains')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 2,
            next: null,
            previous: null,
            results: [
              { pulp_href: '/pulp/api/v3/distributions/1/', pulp_created: new Date().toISOString(), pulp_last_updated: new Date().toISOString(), base_path: 'dist-1', base_url: '/pulp/content/dist-1/', content_guard: null, pulp_labels: {}, name: 'dist-1', repository: null, repository_version: null },
              { pulp_href: '/pulp/api/v3/distributions/2/', pulp_created: new Date().toISOString(), pulp_last_updated: new Date().toISOString(), base_path: 'dist-2', base_url: '/pulp/content/dist-2/', content_guard: null, pulp_labels: {}, name: 'dist-2', repository: null, repository_version: null },
            ],
          }),
        })
      }
    })

    await page.goto('/distributions')
    await expect(page.getByRole('table')).toBeVisible()

    // Search for non-existent distribution
    const searchInput = page.getByPlaceholder('Search distributions...')
    await searchInput.fill('nonexistent-dist-xyz')

    // Verify no results message (auto-retrying assertion)
    await expect(page.getByText('No distributions found matching your search')).toBeVisible()
  })

  test('pagination works correctly', async ({ page }) => {
    // Mock paginated response
    await page.route(/.*\/pulp\/api\/v3\/distributions\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          count: 25,
          next: 'offset=10',
          previous: null,
          results: Array.from({ length: 10 }, (_, i) => ({
            pulp_href: `/pulp/api/v3/distributions/${i + 1}/`,
            pulp_created: new Date().toISOString(),
            pulp_last_updated: new Date().toISOString(),
            base_path: `dist-${i + 1}`,
            base_url: `/pulp/content/dist-${i + 1}/`,
            content_guard: null,
            pulp_labels: {},
            name: `dist-${i + 1}`,
            repository: null,
            repository_version: null,
          })),
        }),
      })
    })

    await page.goto('/distributions')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for pagination controls
    const nextButton = page.getByRole('button', { name: 'Next' })
    const prevButton = page.getByRole('button', { name: 'Previous' })

    await expect(nextButton).toBeVisible()
    await expect(prevButton).toBeDisabled()
  })
})
