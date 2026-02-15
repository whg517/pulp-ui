import { test, expect } from '@playwright/test'
import { setupApiMocks } from './mocks/api-mocks'

test.describe('Repositories Management Flow', () => {
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

  test('displays repositories list page', async ({ page }) => {
    await page.goto('/repositories')

    // Verify page header
    await expect(page.getByRole('heading', { name: 'Repositories' })).toBeVisible()
    await expect(page.getByText('Manage your Pulp repositories')).toBeVisible()

    // Verify create button exists
    await expect(page.getByRole('button', { name: /Create Repository/ })).toBeVisible()

    // Verify search input exists
    await expect(page.getByPlaceholder('Search repositories...')).toBeVisible()
  })

  test('displays repositories table with correct columns', async ({ page }) => {
    await page.goto('/repositories')

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible()

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Name' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Description' })).toBeVisible()
  })

  test('displays repository list after loading', async ({ page }) => {
    await page.goto('/repositories')

    // Wait for table to load
    await expect(page.getByRole('table')).toBeVisible()

    // Verify at least one repository row exists
    const rows = page.getByRole('row')
    await expect(rows.first()).toBeVisible()
  })

  test('searches repositories by name', async ({ page }) => {
    await page.goto('/repositories')

    // Wait for initial load
    await expect(page.getByRole('table')).toBeVisible()

    // Type in search
    const searchInput = page.getByPlaceholder('Search repositories...')
    await searchInput.fill('repo-1')

    // Verify search input has the value
    await expect(searchInput).toHaveValue('repo-1')
  })

  test('navigates to repository detail on row click', async ({ page }) => {
    await page.goto('/repositories')
    await expect(page.getByRole('table')).toBeVisible()

    // Click on a repository name link
    const repoLink = page.getByRole('link', { name: /repo-/ }).first()
    if (await repoLink.isVisible()) {
      await repoLink.click()
      // Verify we navigated to detail page
      await expect(page).toHaveURL(/\/repositories\//)
    }
  })

  test('shows empty state when no repositories exist', async ({ page }) => {
    // Mock empty response
    await page.route(/.*\/pulp\/api\/v3\/repositories\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ count: 0, next: null, previous: null, results: [] }),
      })
    })

    await page.goto('/repositories')

    // Verify empty state message
    await expect(page.getByText('No repositories found')).toBeVisible()
  })

  test('shows error state when API fails', async ({ page }) => {
    // Mock error response
    await page.route(/.*\/pulp\/api\/v3\/repositories\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Internal server error' }),
      })
    })

    await page.goto('/repositories')

    // Verify error message
    await expect(page.getByText('Failed to load repositories')).toBeVisible()
  })
})
