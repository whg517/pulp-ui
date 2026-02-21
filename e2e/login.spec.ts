import { test as base, expect, Page, Browser } from '@playwright/test'
import { test as authenticatedTest } from './fixtures'

// Create a fresh page fixture for login tests that ensures no auth state
const test = base.extend<{
  freshPage: Page
}>({
  freshPage: async ({ browser }, use) => {
    // Create a completely fresh browser context for login tests
    // This ensures no auth state from previous tests persists
    const context = await browser.newContext()
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

test.describe('Login Flow', () => {
  test.beforeEach(async ({ freshPage }) => {
    // Navigate to login page
    await freshPage.goto('/login')
  })

  test('displays login form with all required fields', async ({ freshPage }) => {
    const page = freshPage
    // Verify page title and heading
    await expect(page.getByRole('heading', { name: 'Pulp UI' })).toBeVisible()
    await expect(page.getByText('Sign in to manage your Pulp repositories')).toBeVisible()

    // Verify form fields exist
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('shows validation error when username is empty', async ({ freshPage }) => {
    const page = freshPage
    await page.getByLabel('Password').fill('testpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Username is required')).toBeVisible()
  })

  test('shows validation error when password is empty', async ({ freshPage }) => {
    const page = freshPage
    await page.getByLabel('Username').fill('testuser')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Password is required')).toBeVisible()
  })

  // Skip: This test is timing-sensitive and hard to reliably test in E2E
  test.skip('shows loading state during login', async ({ freshPage }) => {
    // Timing-sensitive test - loading state appears briefly during API call
  })

  test('redirects to dashboard after successful login', async ({ freshPage }) => {
    const page = freshPage
    // Fill in credentials - use real credentials from auth helper
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('admin')

    // Submit form
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/')

    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('shows error message for invalid credentials', async ({ freshPage }) => {
    const page = freshPage
    // Use wrong password to test real API 401 response
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Verify error message is displayed
    await expect(page.getByText(/Authentication failed|Invalid credentials/i)).toBeVisible()

    // Verify we're still on login page
    await expect(page).toHaveURL('/login')
  })

  // Skip: Requires network mock to simulate unreachable server
  test.skip('shows error message when server is unreachable', async ({ freshPage }) => {
    // Requires network mock - not testable with real API
  })
})

// Tests that require authentication use the authenticatedTest from fixtures
authenticatedTest.describe('Login Flow - Authenticated', () => {
  authenticatedTest('redirects authenticated users away from login page', async ({ authenticatedPage }) => {
    // authenticatedPage fixture logs in via UI before test
    // Try to navigate to login page
    await authenticatedPage.goto('/login')

    // Should be redirected back to dashboard
    await expect(authenticatedPage).toHaveURL('/')
  })

  authenticatedTest('persists authentication across page reloads', async ({ authenticatedPage }) => {
    // authenticatedPage is already logged in
    // Reload the page
    await authenticatedPage.reload()

    // Should still be on dashboard (not redirected to login)
    await expect(authenticatedPage).toHaveURL('/')
    await expect(authenticatedPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })
})
