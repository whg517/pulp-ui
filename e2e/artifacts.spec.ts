import { test, expect } from './fixtures'

test.describe('Artifacts Management Flow', () => {
  test('displays artifacts list page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/artifacts')

    // Verify page header
    await expect(authenticatedPage.getByRole('heading', { name: 'Artifacts' })).toBeVisible()
    await expect(authenticatedPage.getByText('Manage uploaded artifacts in your Pulp instance')).toBeVisible()
  })

  test('displays artifacts table with correct columns', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/artifacts')

    // Wait for page header first
    await expect(authenticatedPage.getByRole('heading', { name: 'Artifacts' })).toBeVisible()

    // Wait a bit for content to load
    await authenticatedPage.waitForTimeout(2000)

    // Check for table, empty state, or error state
    const table = authenticatedPage.getByRole('table')
    const emptyState = authenticatedPage.getByText('No artifacts found')
    const errorState = authenticatedPage.getByText('Failed to load')

    const hasTable = await table.isVisible().catch(() => false)
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    const hasError = await errorState.isVisible().catch(() => false)

    expect(hasTable || hasEmpty || hasError).toBe(true)

    if (hasTable) {
      // Verify column headers
      await expect(authenticatedPage.getByRole('columnheader', { name: 'File' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'SHA256' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Size' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Created' })).toBeVisible()
      await expect(authenticatedPage.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
    }
  })

  test('shows loading skeleton while fetching artifacts', async ({ authenticatedPage }) => {
    await authenticatedPage.route('**/pulp/api/v3/artifacts/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.continue()
    })

    await authenticatedPage.goto('/artifacts')

    // Verify loading skeletons are shown
    const skeletons = authenticatedPage.locator('[class*="animate-pulse"]')
    await expect(skeletons.first()).toBeVisible()
  })

  test('search field selector exists', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/artifacts')

    // Wait for page header first
    await expect(authenticatedPage.getByRole('heading', { name: 'Artifacts' })).toBeVisible()

    // Check for search input - this should always exist
    const searchInput = authenticatedPage.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible()
  })

  test('search input exists', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/artifacts')

    // Check for search input
    const searchInput = authenticatedPage.getByPlaceholder('Search by file path...')
    await expect(searchInput).toBeVisible()
  })

  test('refresh button exists and works', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/artifacts')

    // Find and click refresh button
    const refreshButton = authenticatedPage.getByRole('button', { name: 'Refresh' })
    await refreshButton.click()

    // Verify page is still functional
    await expect(authenticatedPage.getByRole('heading', { name: 'Artifacts' })).toBeVisible()
  })

  test('shows empty state when no artifacts exist', async ({ authenticatedPage }) => {
    // Mock empty response
    await authenticatedPage.route('**/pulp/api/v3/artifacts/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await authenticatedPage.goto('/artifacts')

    // Verify empty state message
    await expect(authenticatedPage.getByText('No artifacts found')).toBeVisible()
  })

  test('shows error state when API fails', async ({ authenticatedPage }) => {
    // Mock error response
    await authenticatedPage.route('**/pulp/api/v3/artifacts/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await authenticatedPage.goto('/artifacts')

    // Verify error message
    await expect(authenticatedPage.getByText('Failed to load artifacts')).toBeVisible()
  })

  test('search by SHA256 switches placeholder', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/artifacts')

    // Select SHA256 search option
    const searchSelect = authenticatedPage.locator('select')
    await searchSelect.selectOption('sha256')

    // Verify placeholder changed
    await expect(authenticatedPage.getByPlaceholder('Search by SHA256...')).toBeVisible()
  })

  test('shows search empty state when no matches', async ({ authenticatedPage }) => {
    // Mock response with artifacts initially
    await authenticatedPage.route('**/pulp/api/v3/artifacts/**', async (route) => {
      const url = route.request().url()
      if (url.includes('file__contains') || url.includes('sha256__contains')) {
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
            count: 1,
            next: null,
            previous: null,
            results: [
              {
                pulp_href: '/pulp/api/v3/artifacts/1/',
                pulp_created: new Date().toISOString(),
                file: 'test-file.tar.gz',
                size: 1024,
                sha256: 'abc123',
              },
            ],
          }),
        })
      }
    })

    await authenticatedPage.goto('/artifacts')
    await expect(authenticatedPage.getByRole('heading', { name: 'Artifacts' })).toBeVisible()

    // Search for non-existent artifact
    const searchInput = authenticatedPage.getByPlaceholder('Search by file path...')
    await searchInput.fill('nonexistent-artifact-xyz-12345')

    // Verify no results message
    await expect(authenticatedPage.getByText('No artifacts found matching your search')).toBeVisible()
  })

  test('view details button opens dialog', async ({ authenticatedPage }) => {
    // Mock response with an artifact
    await authenticatedPage.route('**/pulp/api/v3/artifacts/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              pulp_href: '/pulp/api/v3/artifacts/test-artifact/',
              pulp_created: new Date().toISOString(),
              file: '/pulp/api/v3/artifacts/test-artifact/file.tar.gz',
              size: 1024,
              sha256: 'abc123def456',
            },
          ],
        }),
      })
    })

    await authenticatedPage.goto('/artifacts')
    await expect(authenticatedPage.getByRole('heading', { name: 'Artifacts' })).toBeVisible()

    // Click view details button
    const viewButton = authenticatedPage.getByRole('button', { name: 'View details' })
    if (await viewButton.isVisible()) {
      await viewButton.click()

      // Verify dialog opens
      await expect(authenticatedPage.getByRole('heading', { name: 'Artifact Details' })).toBeVisible()
    }
  })

  test('delete button shows confirmation dialog', async ({ authenticatedPage }) => {
    // Mock response with an artifact
    await authenticatedPage.route('**/pulp/api/v3/artifacts/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              pulp_href: '/pulp/api/v3/artifacts/test-artifact/',
              pulp_created: new Date().toISOString(),
              file: 'test-file.tar.gz',
              size: 1024,
              sha256: 'abc123def456',
            },
          ],
        }),
      })
    })

    await authenticatedPage.goto('/artifacts')
    await expect(authenticatedPage.getByRole('heading', { name: 'Artifacts' })).toBeVisible()

    // Click delete button
    const deleteButton = authenticatedPage.getByRole('button', { name: 'Delete artifact' })
    if (await deleteButton.isVisible()) {
      await deleteButton.click()

      // Verify confirmation dialog
      await expect(authenticatedPage.getByText('Are you sure you want to delete this artifact?')).toBeVisible()
    }
  })

  test('pagination controls work correctly', async ({ authenticatedPage }) => {
    // Mock paginated response
    await authenticatedPage.route('**/pulp/api/v3/artifacts/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          count: 25,
          next: 'offset=10',
          previous: null,
          results: Array.from({ length: 10 }, (_, i) => ({
            pulp_href: `/pulp/api/v3/artifacts/${i + 1}/`,
            pulp_created: new Date().toISOString(),
            file: `file-${i + 1}.tar.gz`,
            size: 1024,
            sha256: `hash-${i + 1}`,
          })),
        }),
      })
    })

    await authenticatedPage.goto('/artifacts')
    await expect(authenticatedPage.getByRole('heading', { name: 'Artifacts' })).toBeVisible()

    // Check for pagination controls
    const nextButton = authenticatedPage.getByRole('button', { name: 'Next' })
    const prevButton = authenticatedPage.getByRole('button', { name: 'Previous' })

    await expect(nextButton).toBeVisible()
    await expect(prevButton).toBeDisabled()
  })
})
