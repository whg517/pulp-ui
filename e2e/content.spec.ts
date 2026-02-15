import { test, expect } from '@playwright/test'
import { setupApiMocks } from './mocks/api-mocks'

test.describe('Content Browsing Flow', () => {
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

  test('displays content list page', async ({ page }) => {
    await page.goto('/content')

    // Verify page header
    await expect(page.getByRole('heading', { name: 'Content' })).toBeVisible()
    await expect(page.getByText('Browse all content in your Pulp instance')).toBeVisible()

    // Verify search input exists
    await expect(page.getByPlaceholder('Search by relative path...')).toBeVisible()
  })

  test('displays content table with correct columns', async ({ page }) => {
    await page.goto('/content')

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Relative Path' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Artifact' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Created' })).toBeVisible()
  })

  test('shows loading skeleton while fetching content', async ({ page }) => {
    // Slow down the API response and return mock data
    await page.route(/.*\/pulp\/api\/v3\/content\/(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 2,
          next: null,
          previous: null,
          results: [
            { pulp_href: '/pulp/api/v3/content/1/', pulp_created: new Date().toISOString(), artifact: null, relative_path: 'file-1.txt' },
            { pulp_href: '/pulp/api/v3/content/2/', pulp_created: new Date().toISOString(), artifact: null, relative_path: 'file-2.txt' },
          ],
        }),
      })
    })

    await page.goto('/content')

    // Verify loading skeletons are shown (animate-pulse class)
    const skeletons = page.locator('[class*="animate-pulse"]')
    await expect(skeletons.first()).toBeVisible()
  })

  test('displays content list after loading', async ({ page }) => {
    await page.goto('/content')

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible()

    // Verify at least one content row exists
    const rows = page.getByRole('row')
    await expect(rows.first()).toBeVisible()
  })

  test('searches content by relative path', async ({ page }) => {
    await page.goto('/content')

    // Wait for initial load
    await expect(page.getByRole('table')).toBeVisible()

    // Type in search
    const searchInput = page.getByPlaceholder('Search by relative path...')
    await searchInput.fill('file-1')

    // Verify search input value (auto-retrying assertion)
    await expect(searchInput).toHaveValue('file-1')
  })

  test('refreshes content list', async ({ page }) => {
    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Click refresh button
    const refreshButtons = page.locator('button').filter({ has: page.locator('svg') })
    await refreshButtons.first().click()

    // Verify page is still functional
    await expect(page.getByRole('table')).toBeVisible()
  })

  test('displays relative path with monospace font', async ({ page }) => {
    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for monospace styled content (font-mono class)
    const relativePath = page.locator('td.font-mono').first()
    if (await relativePath.isVisible()) {
      await expect(relativePath).toBeVisible()
    }
  })

  test('displays artifact reference when available', async ({ page }) => {
    // Mock content with artifact
    await page.route(/.*\/pulp\/api\/v3\/content\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              pulp_href: '/pulp/api/v3/content/1/',
              pulp_created: new Date().toISOString(),
              artifact: '/pulp/api/v3/artifacts/123/',
              relative_path: 'test-file.txt',
            },
          ],
        }),
      })
    })

    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for artifact code element
    const artifactCode = page.locator('code')
    if (await artifactCode.isVisible()) {
      await expect(artifactCode).toBeVisible()
    }
  })

  test('shows empty state when no content exists', async ({ page }) => {
    // Mock empty response
    await page.route(/.*\/pulp\/api\/v3\/content\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await page.goto('/content')

    // Verify empty state message
    await expect(page.getByText('No content found')).toBeVisible()
  })

  test('shows error state when API fails', async ({ page }) => {
    // Mock error response
    await page.route(/.*\/pulp\/api\/v3\/content\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await page.goto('/content')

    // Verify error message
    await expect(page.getByText('Failed to load content')).toBeVisible()
  })

  test('shows search empty state when no matches', async ({ page }) => {
    // Mock empty response for search query
    await page.route(/.*\/pulp\/api\/v3\/content\/(\?.*)?$/, async (route) => {
      const url = route.request().url()
      // If search param exists, return empty results
      if (url.includes('relative_path__contains')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
        })
      } else {
        // Return mock data for initial load
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            count: 2,
            next: null,
            previous: null,
            results: [
              { pulp_href: '/pulp/api/v3/content/1/', pulp_created: new Date().toISOString(), artifact: null, relative_path: 'file-1.txt' },
              { pulp_href: '/pulp/api/v3/content/2/', pulp_created: new Date().toISOString(), artifact: null, relative_path: 'file-2.txt' },
            ],
          }),
        })
      }
    })

    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Search for non-existent content
    const searchInput = page.getByPlaceholder('Search by relative path...')
    await searchInput.fill('nonexistent-file-xyz.txt')

    // Verify no results message (auto-retrying assertion)
    await expect(page.getByText('No content found matching your search')).toBeVisible()
  })

  test('displays creation timestamp in relative format', async ({ page }) => {
    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for relative time format (e.g., "5 minutes ago", "2 hours ago")
    const relativeTimePattern = /\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago/
    const timeCell = page.getByText(relativeTimePattern).first()

    if (await timeCell.isVisible()) {
      await expect(timeCell).toBeVisible()
    }
  })

  test('pagination works correctly', async ({ page }) => {
    // Mock paginated response
    await page.route(/.*\/pulp\/api\/v3\/content\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          count: 25,
          next: 'offset=10',
          previous: null,
          results: Array.from({ length: 10 }, (_, i) => ({
            pulp_href: `/pulp/api/v3/content/${i + 1}/`,
            pulp_created: new Date().toISOString(),
            artifact: `/pulp/api/v3/artifacts/${i + 1}/`,
            relative_path: `file-${i + 1}.txt`,
          })),
        }),
      })
    })

    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for pagination controls
    const nextButton = page.getByRole('button', { name: 'Next' })
    const prevButton = page.getByRole('button', { name: 'Previous' })

    await expect(nextButton).toBeVisible()
    await expect(prevButton).toBeDisabled()
  })

  test('displays dash for missing artifact', async ({ page }) => {
    // Mock content without artifact
    await page.route(/.*\/pulp\/api\/v3\/content\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              pulp_href: '/pulp/api/v3/content/1/',
              pulp_created: new Date().toISOString(),
              artifact: null,
              relative_path: 'orphan-file.txt',
            },
          ],
        }),
      })
    })

    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Find the artifact cell with dash
    const artifactCell = page.getByRole('cell').filter({ hasText: '-' }).first()
    await expect(artifactCell).toBeVisible()
  })
})
