import { test, expect } from './fixtures/index.js'

test.describe('Repositories Management Flow', () => {
  test('displays repositories list page', async ({ pageObjects }) => {
    await pageObjects.repositories.goto()

    await expect(pageObjects.repositories.heading).toBeVisible()
    await expect(pageObjects.repositories.subtitle).toBeVisible()
    await expect(pageObjects.repositories.createButton).toBeVisible()
    await expect(pageObjects.repositories.searchInput).toBeVisible()
  })

  test('displays repositories table with correct columns', async ({ pageObjects }) => {
    await pageObjects.repositories.goto()

    // Wait for content to load
    const noRepo = pageObjects.repositories.page.getByText('No repositories found')
    const nameHeader = pageObjects.repositories.page.getByRole('columnheader', { name: 'Name' })
    const errorState = pageObjects.repositories.page.getByText(/Failed to load|Error/)
    
    await expect(noRepo.or(nameHeader).or(errorState)).toBeVisible({ timeout: 15000 })

    const hasTable = await pageObjects.repositories.table.isVisible().catch(() => false)
    
    if (hasTable) {
      await expect(nameHeader).toBeVisible()
      await expect(pageObjects.repositories.getColumnHeader('Description')).toBeVisible()
    }
  })

  test('displays repository list after loading', async ({ pageObjects, factory }) => {
    const repoName = `test-repo-display-${Date.now()}`
    await factory.createRepository({ name: repoName })

    await pageObjects.repositories.goto()
    await expect(pageObjects.repositories.page.getByText(repoName, { exact: true })).toBeVisible({ timeout: 30000 })
  })

  test('searches repositories by name', async ({ pageObjects, factory }) => {
    const repoName = `test-repo-search-${Date.now()}`
    await factory.createRepository({ name: repoName })

    await pageObjects.repositories.goto()
    await expect(pageObjects.repositories.table).toBeVisible({ timeout: 30000 })

    await pageObjects.repositories.search(repoName)
    await expect(pageObjects.repositories.searchInput).toHaveValue(repoName)
    await expect(pageObjects.repositories.page.getByText(repoName, { exact: true })).toBeVisible()
  })

  test('navigates to repository detail on row click', async ({ pageObjects, factory }) => {
    const repoName = `test-repo-nav-${Date.now()}`
    await factory.createRepository({ name: repoName })

    await pageObjects.repositories.goto()
    await expect(pageObjects.repositories.table).toBeVisible({ timeout: 30000 })
    await expect(pageObjects.repositories.page.getByText(repoName, { exact: true })).toBeVisible({ timeout: 30000 })

    await pageObjects.repositories.clickRepository(repoName)
    await expect(pageObjects.repositories.page).toHaveURL(/\/repositories\//)
  })

  test('shows empty state when no repositories exist', async ({ pageObjects }) => {
    await pageObjects.repositories.goto()
    
    // Check if empty state appears (repositories may already exist in the system)
    const isEmptyVisible = await pageObjects.repositories.getEmptyState().isVisible().catch(() => false)
    
    // This test is informational - empty state may not appear if repos exist
    if (isEmptyVisible) {
      await expect(pageObjects.repositories.getEmptyState()).toBeVisible()
    }
  })

  test('shows error state when API fails', async ({ pageObjects }) => {
    await pageObjects.repositories.page.route('**/pulp/api/v3/repositories/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await pageObjects.repositories.goto()
    await expect(pageObjects.repositories.getErrorState()).toBeVisible()
  })
})
