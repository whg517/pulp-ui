import { test, expect } from './fixtures'

test.describe('Content Browsing Flow', () => {
  test('displays content list page', async ({ authenticatedPage: page }) => {
    await page.goto('/content')

    // Verify page header
    await expect(page.getByRole('heading', { name: 'Content' })).toBeVisible()
    await expect(page.getByText('Browse all content in your Pulp instance')).toBeVisible()

    // Verify search input exists
    await expect(page.getByPlaceholder('Search by relative path...')).toBeVisible()
  })

  test('displays content table with correct columns', async ({ authenticatedPage: page }) => {
    await page.goto('/content')

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Relative Path' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Artifact' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Created' })).toBeVisible()
  })

  test('shows loading skeleton while fetching content', async ({ authenticatedPage: page }) => {
    // Slow down the API response with route delay
    await page.route(/.*\/pulp\/api\/v3\/content\/(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    await page.goto('/content')

    // Verify loading skeletons are shown (animate-pulse class)
    const skeletons = page.locator('[class*="animate-pulse"]')
    await expect(skeletons.first()).toBeVisible()
  })

  // SKIPPED: Requires synced content from a repository sync workflow
  // To test: Create a repository, create a remote, sync the remote, then verify content appears
  test.skip('displays content list after loading', async ({ authenticatedPage: page }) => {
    await page.goto('/content')

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible()

    // Verify at least one content row exists
    const rows = page.getByRole('row')
    await expect(rows.first()).toBeVisible()
  })

  // SKIPPED: Requires synced content to search through
  // To test: Create a repository, create a remote, sync the remote, then search for content
  test.skip('searches content by relative path', async ({ authenticatedPage: page }) => {
    await page.goto('/content')

    // Wait for initial load
    await expect(page.getByRole('table')).toBeVisible()

    // Type in search
    const searchInput = page.getByPlaceholder('Search by relative path...')
    await searchInput.fill('file-1')

    // Verify search input value (auto-retrying assertion)
    await expect(searchInput).toHaveValue('file-1')
  })

  // SKIPPED: Requires synced content to refresh
  test.skip('refreshes content list', async ({ authenticatedPage: page }) => {
    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Click refresh button
    const refreshButtons = page.locator('button').filter({ has: page.locator('svg') })
    await refreshButtons.first().click()

    // Verify page is still functional
    await expect(page.getByRole('table')).toBeVisible()
  })

  // SKIPPED: Requires synced content to verify UI styling
  test.skip('displays relative path with monospace font', async ({ authenticatedPage: page }) => {
    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for monospace styled content (font-mono class)
    const relativePath = page.locator('td.font-mono').first()
    await expect(relativePath).toBeVisible()
  })

  // SKIPPED: Requires synced content with artifacts
  test.skip('displays artifact reference when available', async ({ authenticatedPage: page }) => {
    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for artifact code element
    const artifactCode = page.locator('code')
    await expect(artifactCode.first()).toBeVisible()
  })

  test('shows empty state when no content exists', async ({ authenticatedPage: page }) => {
    // A fresh Pulp instance has no content - this should work with real API
    await page.goto('/content')

    // Verify empty state message (will show if no content exists)
    await expect(page.getByText('No content found')).toBeVisible()
  })

  test('shows error state when API fails', async ({ authenticatedPage: page }) => {
    // Targeted mock for error state test only
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

  // SKIPPED: Requires synced content to search for non-existent item
  test.skip('shows search empty state when no matches', async ({ authenticatedPage: page }) => {
    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Search for non-existent content
    const searchInput = page.getByPlaceholder('Search by relative path...')
    await searchInput.fill('nonexistent-file-xyz.txt')

    // Verify no results message (auto-retrying assertion)
    await expect(page.getByText('No content found matching your search')).toBeVisible()
  })

  // SKIPPED: Requires synced content to verify relative time format
  test.skip('displays creation timestamp in relative format', async ({ authenticatedPage: page }) => {
    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for relative time format (e.g., "5 minutes ago", "2 hours ago")
    const relativeTimePattern = /\d+\s+(second|minute|hour|day|week|month|year)s?\s+ago/
    const timeCell = page.getByText(relativeTimePattern).first()

    await expect(timeCell).toBeVisible()
  })

  // SKIPPED: Complex test requiring many content items via sync workflow
  test.skip('pagination works correctly', async ({ authenticatedPage: page }) => {
    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Check for pagination controls
    const nextButton = page.getByRole('button', { name: 'Next' })
    const prevButton = page.getByRole('button', { name: 'Previous' })

    // If pagination exists, verify state
    if (await nextButton.isVisible()) {
      await expect(prevButton).toBeDisabled()
    }
  })

  // SKIPPED: Requires synced content without artifacts
  test.skip('displays dash for missing artifact', async ({ authenticatedPage: page }) => {
    await page.goto('/content')
    await expect(page.getByRole('table')).toBeVisible()

    // Find the artifact cell with dash
    const artifactCell = page.getByRole('cell').filter({ hasText: '-' }).first()
    await expect(artifactCell).toBeVisible()
  })
})
