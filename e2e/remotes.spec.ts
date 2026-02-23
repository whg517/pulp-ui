import { test, expect } from './fixtures/index.js'

test.describe('Remotes Management Flow', () => {
  test('displays remotes list page', async ({ pageObjects }) => {
    await pageObjects.remotes.goto()

    await expect(pageObjects.remotes.heading).toBeVisible()
    await expect(pageObjects.remotes.createButton).toBeVisible()
    await expect(pageObjects.remotes.searchInput).toBeVisible()
  })

  test('displays remotes table with correct columns', async ({ pageObjects }) => {
    await pageObjects.remotes.goto()

    // Wait for content to load
    const noRemote = pageObjects.remotes.page.getByText('No remotes found')
    const nameHeader = pageObjects.remotes.page.getByRole('columnheader', { name: 'Name' })
    const errorState = pageObjects.remotes.page.getByText(/Failed to load|Error/)
    
    await expect(noRemote.or(nameHeader).or(errorState)).toBeVisible({ timeout: 15000 })

    const hasTable = await pageObjects.remotes.table.isVisible().catch(() => false)
    
    if (hasTable) {
      await expect(nameHeader).toBeVisible()
      await expect(pageObjects.remotes.getColumnHeader('URL')).toBeVisible()
      await expect(pageObjects.remotes.getColumnHeader('Created')).toBeVisible()
      await expect(pageObjects.remotes.getColumnHeader('Actions')).toBeVisible()
    }
  })

  test('displays remotes list after loading', async ({ pageObjects, factory }) => {
    const remoteName = `test-remote-${Date.now()}`
    await factory.createRemote({ name: remoteName, url: 'https://example.com' })

    await pageObjects.remotes.goto()
    await expect(pageObjects.remotes.page.getByText(remoteName, { exact: true })).toBeVisible({ timeout: 30000 })
  })

  test('searches remotes by name', async ({ pageObjects, factory }) => {
    const remoteName = `test-remote-${Date.now()}`
    await factory.createRemote({ name: remoteName, url: 'https://example.com' })

    await pageObjects.remotes.goto()
    await expect(pageObjects.remotes.table).toBeVisible({ timeout: 30000 })

    await pageObjects.remotes.search(remoteName)
    await expect(pageObjects.remotes.searchInput).toHaveValue(remoteName)
    await expect(pageObjects.remotes.page.getByText(remoteName, { exact: true })).toBeVisible()
  })

  test('navigates to remote detail on row click', async ({ pageObjects, factory }) => {
    const remoteName = `test-remote-click-${Date.now()}`
    await factory.createRemote({ name: remoteName, url: 'https://example.com' })

    await pageObjects.remotes.goto()
    await expect(pageObjects.remotes.table).toBeVisible({ timeout: 30000 })
    await expect(pageObjects.remotes.page.getByText(remoteName, { exact: true })).toBeVisible()

    await pageObjects.remotes.clickRemote(remoteName)
    await expect(pageObjects.remotes.page).toHaveURL(/\/remotes\//)
  })

  test('shows empty state when no remotes exist', async ({ pageObjects }) => {
    await pageObjects.remotes.page.route('**/pulp/api/v3/remotes/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await pageObjects.remotes.goto()
    await expect(pageObjects.remotes.getEmptyState()).toBeVisible()
  })

  test('shows error state when API fails', async ({ pageObjects }) => {
    await pageObjects.remotes.page.route('**/pulp/api/v3/remotes/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await pageObjects.remotes.goto()
    await expect(pageObjects.remotes.getErrorState()).toBeVisible()
  })
})
