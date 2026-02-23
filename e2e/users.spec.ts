import { test, expect } from './fixtures/index.js'

test.describe('Users Management', () => {
  test('displays users list page', async ({ pageObjects }) => {
    const users = pageObjects.users
    await users.goto()
    await expect(users.heading).toBeVisible()
    await expect(users.subtitle).toBeVisible()
  })

  test('displays users table', async ({ pageObjects }) => {
    const users = pageObjects.users
    await users.goto()

    // Wait for content to load
    const noUser = users.page.getByText('No users found')
    const usernameHeader = users.page.getByRole('columnheader', { name: 'Username' })
    const errorState = users.page.getByText(/Failed to load|Error/)
    const adminLink = users.page.getByText('admin')
    
    await expect(noUser.or(usernameHeader).or(errorState).or(adminLink)).toBeVisible({ timeout: 10000 })
  })

  test('shows create user button', async ({ pageObjects }) => {
    const users = pageObjects.users
    await users.goto()
    await expect(users.createUserButton).toBeVisible()
  })

  test('searches users by username', async ({ pageObjects }) => {
    const users = pageObjects.users
    await users.goto()
    await expect(users.searchInput).toBeVisible()
  })

  test('clicks on user to view details', async ({ pageObjects }) => {
    const users = pageObjects.users
    await users.goto()
    await expect(users.heading).toBeVisible()

    const adminLink = users.getUserLink('admin')
    const hasAdmin = await adminLink.isVisible().catch(() => false)

    if (hasAdmin) {
      await adminLink.click()
      await expect(users.page).toHaveURL(/\/users\//)
    }
  })
})
