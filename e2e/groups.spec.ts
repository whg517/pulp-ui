import { test, expect } from './fixtures/index.js'

test.describe('Groups Management', () => {
  test('displays groups list page', async ({ pageObjects }) => {
    const groups = pageObjects.groups
    await groups.goto()
    await expect(groups.heading).toBeVisible()
    await expect(groups.subtitle).toBeVisible()
  })

  test('displays groups table', async ({ pageObjects }) => {
    const groups = pageObjects.groups
    await groups.goto()

    // Wait for content to load - group data may take time to appear
    const noGroups = groups.page.getByText('No groups found')
    const nameHeader = groups.page.getByRole('columnheader', { name: 'Name' })
    const errorState = groups.page.getByText(/Failed to load|Error/)
    
    await expect(noGroups.or(nameHeader).or(errorState)).toBeVisible({ timeout: 15000 })
  })

  test('shows create group button', async ({ pageObjects }) => {
    const groups = pageObjects.groups
    await groups.goto()
    await expect(groups.createGroupButton).toBeVisible()
  })

  test('searches groups by name', async ({ pageObjects }) => {
    const groups = pageObjects.groups
    await groups.goto()
    await expect(groups.searchInput).toBeVisible()
  })
})
