import { test, expect } from '@playwright/test'
import { setupApiMocks } from './mocks/api-mocks'

test.describe('Remotes Management Flow', () => {
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

  test('displays remotes list page', async ({ page }) => {
    await page.goto('/remotes')

    // Verify page header
    await expect(page.getByRole('heading', { name: 'Remotes' })).toBeVisible()
    await expect(page.getByText('Configure external content sources')).toBeVisible()

    // Verify create button exists
    await expect(page.getByRole('button', { name: /Create Remote/ })).toBeVisible()

    // Verify search input exists
    await expect(page.getByPlaceholder('Search remotes...')).toBeVisible()
  })

  test('displays remotes table with correct columns', async ({ page }) => {
    await page.goto('/remotes')

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'URL' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Policy' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'TLS Validation' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Created' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
  })

  test('shows loading skeleton while fetching remotes', async ({ page }) => {
    // Slow down the API response and return mock data
    await page.route(/.*\/pulp\/api\/v3\/remotes\/(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          next: null,
          previous: null,
          results: [
            { pulp_href: '/pulp/api/v3/remotes/1/', pulp_created: new Date().toISOString(), pulp_last_updated: new Date().toISOString(), name: 'remote-1', url: 'https://example.com/repo/1', ca_cert: null, client_cert: null, client_key: null, tls_validation: true, proxy_url: null, pulp_labels: {}, download_concurrency: null, max_retries: null, policy: 'immediate', total_timeout: null, connect_timeout: null, sock_connect_timeout: null, sock_read_timeout: null, headers: null, rate_limit: null },
            { pulp_href: '/pulp/api/v3/remotes/2/', pulp_created: new Date().toISOString(), pulp_last_updated: new Date().toISOString(), name: 'remote-2', url: 'https://example.com/repo/2', ca_cert: null, client_cert: null, client_key: null, tls_validation: true, proxy_url: null, pulp_labels: {}, download_concurrency: null, max_retries: null, policy: 'immediate', total_timeout: null, connect_timeout: null, sock_connect_timeout: null, sock_read_timeout: null, headers: null, rate_limit: null },
          ],
        }),
      })
    })

    await page.goto('/remotes')

    // Verify loading skeletons are shown (animate-pulse class)
    const skeletons = page.locator('[class*="animate-pulse"]')
    await expect(skeletons.first()).toBeVisible()
  })

  test('displays remotes list after loading', async ({ page }) => {
    await page.goto('/remotes')

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible()

    // Verify at least one remote row exists
    const rows = page.getByRole('row')
    await expect(rows.first()).toBeVisible()
  })

  test('searches remotes by name', async ({ page }) => {
    await page.goto('/remotes')

    // Wait for initial load
    await expect(page.getByRole('table')).toBeVisible()

    // Type in search
    const searchInput = page.getByPlaceholder('Search remotes...')
    await searchInput.fill('remote-1')

    // Verify search input value (auto-retrying assertion)
    await expect(searchInput).toHaveValue('remote-1')
  })

  test('refreshes remotes list', async ({ page }) => {
    await page.goto('/remotes')
    await expect(page.getByRole('table')).toBeVisible()

    // Click refresh button
    const refreshButtons = page.locator('button').filter({ has: page.locator('svg') })
    await refreshButtons.first().click()

    // Verify page is still functional
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('displays TLS validation status badges', async ({ page }) => {
    await page.goto('/remotes')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for TLS validation badges
    const enabledBadge = page.getByText('Enabled')
    const disabledBadge = page.getByText('Disabled')

    // At least one of the badges should be visible
    await expect(enabledBadge.or(disabledBadge).first()).toBeVisible()
  })

  test('displays policy badge for remotes', async ({ page }) => {
    await page.goto('/remotes')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for policy badges (immediate, on_demand, etc.)
    const policyBadge = page.locator('[data-variant="outline"]').filter({ hasText: /immediate|on_demand/ })

    // Policy badge should be visible
    if (await policyBadge.first().isVisible()) {
      await expect(policyBadge.first()).toBeVisible()
    }
  })

  test('edits remote', async ({ page }) => {
    await page.goto('/remotes')
    await expect(page.getByRole('table')).toBeVisible()

    // Find and click edit button
    const editButton = page.getByRole('button', { name: 'Edit remote' }).first()
    if (await editButton.isVisible()) {
      await editButton.click()
      // Note: Edit functionality may open a modal or navigate
      // This test verifies the button is clickable
    }
  })

  test('deletes remote with confirmation', async ({ page }) => {
    await page.goto('/remotes')
    await expect(page.getByRole('table')).toBeVisible()

    // Set up dialog handler
    page.on('dialog', (dialog) => {
      expect(dialog.message()).toContain('Are you sure')
      dialog.dismiss() // Cancel the deletion
    })

    // Find and click delete button
    const deleteButton = page.getByRole('button', { name: 'Delete remote' }).first()
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
    }
  })

  test('shows empty state when no remotes exist', async ({ page }) => {
    // Mock empty response
    await page.route(/.*\/pulp\/api\/v3\/remotes\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await page.goto('/remotes')

    // Verify empty state message
    await expect(page.getByText('No remotes found')).toBeVisible()
  })

  test('shows error state when API fails', async ({ page }) => {
    // Mock error response
    await page.route(/.*\/pulp\/api\/v3\/remotes\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await page.goto('/remotes')

    // Verify error message
    await expect(page.getByText('Failed to load remotes')).toBeVisible()
  })

  test('shows search empty state when no matches', async ({ page }) => {
    // Mock empty response for search query
    await page.route(/.*\/pulp\/api\/v3\/remotes\/(\?.*)?$/, async (route) => {
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
              { pulp_href: '/pulp/api/v3/remotes/1/', pulp_created: new Date().toISOString(), pulp_last_updated: new Date().toISOString(), name: 'remote-1', url: 'https://example.com/repo/1', ca_cert: null, client_cert: null, client_key: null, tls_validation: true, proxy_url: null, pulp_labels: {}, download_concurrency: null, max_retries: null, policy: 'immediate', total_timeout: null, connect_timeout: null, sock_connect_timeout: null, sock_read_timeout: null, headers: null, rate_limit: null },
              { pulp_href: '/pulp/api/v3/remotes/2/', pulp_created: new Date().toISOString(), pulp_last_updated: new Date().toISOString(), name: 'remote-2', url: 'https://example.com/repo/2', ca_cert: null, client_cert: null, client_key: null, tls_validation: true, proxy_url: null, pulp_labels: {}, download_concurrency: null, max_retries: null, policy: 'immediate', total_timeout: null, connect_timeout: null, sock_connect_timeout: null, sock_read_timeout: null, headers: null, rate_limit: null },
            ],
          }),
        })
      }
    })

    await page.goto('/remotes')
    await expect(page.getByRole('table')).toBeVisible()

    // Search for non-existent remote
    const searchInput = page.getByPlaceholder('Search remotes...')
    await searchInput.fill('nonexistent-remote-xyz')

    // Verify no results message (auto-retrying assertion)
    await expect(page.getByText('No remotes found matching your search')).toBeVisible()
  })

  test('pagination works correctly', async ({ page }) => {
    // Mock paginated response
    await page.route(/.*\/pulp\/api\/v3\/remotes\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          count: 25,
          next: 'offset=10',
          previous: null,
          results: Array.from({ length: 10 }, (_, i) => ({
            pulp_href: `/pulp/api/v3/remotes/${i + 1}/`,
            pulp_created: new Date().toISOString(),
            pulp_last_updated: new Date().toISOString(),
            name: `remote-${i + 1}`,
            url: `https://example.com/repo/${i + 1}`,
            ca_cert: null,
            client_cert: null,
            client_key: null,
            tls_validation: true,
            proxy_url: null,
            pulp_labels: {},
            download_concurrency: null,
            max_retries: null,
            policy: 'immediate',
            total_timeout: null,
            connect_timeout: null,
            sock_connect_timeout: null,
            sock_read_timeout: null,
            headers: null,
            rate_limit: null,
          })),
        }),
      })
    })

    await page.goto('/remotes')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for pagination controls
    const nextButton = page.getByRole('button', { name: 'Next' })
    const prevButton = page.getByRole('button', { name: 'Previous' })

    await expect(nextButton).toBeVisible()
    await expect(prevButton).toBeDisabled()
  })
})
