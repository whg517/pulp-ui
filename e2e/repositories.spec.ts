import { test, expect } from './fixtures'

test.describe('Repositories Management Flow', () => {
  test('displays repositories list page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/repositories')

    // Verify page header
    await expect(authenticatedPage.getByRole('heading', { name: 'Repositories' })).toBeVisible()
    await expect(authenticatedPage.getByText('Manage your Pulp repositories')).toBeVisible()

    // Verify create button exists
    await expect(authenticatedPage.getByRole('button', { name: /Create Repository/ })).toBeVisible()

    // Verify search input exists
    await expect(authenticatedPage.getByPlaceholder('Search repositories...')).toBeVisible()
  })

  test('displays repositories table with correct columns', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/repositories')

    // Wait for table to load
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Verify table headers
    await expect(authenticatedPage.getByRole('columnheader', { name: 'Name' })).toBeVisible()
    await expect(authenticatedPage.getByRole('columnheader', { name: 'Description' })).toBeVisible()
  })

  test('displays repository list after loading', async ({ authenticatedPage, factory }) => {
    // Create a test repository first
    await factory.createRepository({ name: `test-repo-display-${Date.now()}` })

    await authenticatedPage.goto('/repositories')

    // Wait for table to load
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Verify at least one repository row exists
    const rows = authenticatedPage.getByRole('row')
    await expect(rows.first()).toBeVisible()
  })

  test('searches repositories by name', async ({ authenticatedPage, factory }) => {
    const repoName = `test-repo-search-${Date.now()}`
    // Create a named repository
    await factory.createRepository({ name: repoName })

    await authenticatedPage.goto('/repositories')

    // Wait for initial load
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Type in search
    const searchInput = authenticatedPage.getByPlaceholder('Search repositories...')
    await searchInput.fill(repoName)

    // Verify search input has the value
    await expect(searchInput).toHaveValue(repoName)

    // Verify the repository appears in results
    await expect(authenticatedPage.getByText(repoName)).toBeVisible()
  })

  test('navigates to repository detail on row click', async ({ authenticatedPage, factory }) => {
    const repoName = `test-repo-nav-${Date.now()}`
    // Create a repository
    await factory.createRepository({ name: repoName })

    await authenticatedPage.goto('/repositories')
    await expect(authenticatedPage.getByRole('table')).toBeVisible()

    // Wait for the repository to appear
    await expect(authenticatedPage.getByText(repoName)).toBeVisible()

    // Click on the repository name link
    const repoLink = authenticatedPage.getByRole('link', { name: repoName })
    await repoLink.click()

    // Verify we navigated to detail page
    await expect(authenticatedPage).toHaveURL(/\/repositories\//)
  })

  test('shows empty state when no repositories exist', async ({ authenticatedPage, api }) => {
    // Delete all test repositories first to ensure empty state
    const repos = await api.get<{ results: Array<{ pulp_href: string; name: string }> }>('/repositories/?name__contains=test-repo')
    for (const repo of repos.results) {
      try {
        await api.delete(repo.pulp_href)
      } catch {
        // Ignore if already deleted
      }
    }

    await authenticatedPage.goto('/repositories')

    // Verify empty state message
    await expect(authenticatedPage.getByText('No repositories found')).toBeVisible()
  })

  test('shows error state when API fails', async ({ authenticatedPage }) => {
    // Mock error response using targeted route
    await authenticatedPage.route('**/pulp/api/v3/repositories/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await authenticatedPage.goto('/repositories')

    // Verify error message
    await expect(authenticatedPage.getByText('Failed to load repositories')).toBeVisible()
  })
})
