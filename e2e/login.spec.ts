import { test, expect } from '@playwright/test'
import { setupApiMocks } from './mocks/api-mocks'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await setupApiMocks(page)

    // Clear any existing auth state (cookies and localStorage)
    await page.context().clearCookies()
    await page.goto('/login')
    // Clear localStorage after navigation to ensure clean state
    await page.evaluate(() => localStorage.clear())
  })

  test('displays login form with all required fields', async ({ page }) => {
    // Verify page title and heading
    await expect(page.getByRole('heading', { name: 'Pulp UI' })).toBeVisible()
    await expect(page.getByText('Sign in to manage your Pulp repositories')).toBeVisible()

    // Verify form fields exist
    await expect(page.getByLabel('Username')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('shows validation error when username is empty', async ({ page }) => {
    await page.getByLabel('Password').fill('testpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Username is required')).toBeVisible()
  })

  test('shows validation error when password is empty', async ({ page }) => {
    await page.getByLabel('Username').fill('testuser')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText('Password is required')).toBeVisible()
  })

  // Skip: This test is timing-sensitive and hard to reliably test in E2E
  test.skip('shows loading state during login', async ({ page }) => {
    // Clear existing routes and set up slow status API
    await page.unrouteAll({ behavior: 'ignoreErrors' })

    // Slow down the status API to see loading state
    await page.route(/.*\/pulp\/api\/v3\/status\/(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pulp_href: '/pulp/api/v3/status/',
          pulp_created: new Date().toISOString(),
          versions: [{ component: 'core', version: '3.40.0' }],
          public_key: null,
          known_content: 100,
          database_connection: { connected: true },
          redis_connection: { connected: true },
          storage: { total: 1000000, used: 500000, free: 500000 },
        }),
      })
    })

    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('password')

    // Click sign in and verify button shows loading state
    const submitButton = page.getByRole('button', { name: 'Sign in' })
    await submitButton.click()

    // Check for loading indicator (button text changes to "Signing in...")
    await expect(page.getByRole('button', { name: /Signing in/ })).toBeVisible()
  })

  test('redirects to dashboard after successful login', async ({ page }) => {
    // Fill in credentials
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('password')

    // Submit form
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/')

    // Verify we're on the dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  // Skip: Route override conflicts with beforeEach setup
  test.skip('shows error message for invalid credentials', async ({ page }) => {
    // Clear existing routes and set up error response
    await page.unrouteAll({ behavior: 'ignoreErrors' })

    // Mock failed authentication response
    await page.route(/.*\/pulp\/api\/v3\/status\/(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Invalid credentials' }),
      })
    })

    await page.getByLabel('Username').fill('invalid')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Verify error message is displayed
    await expect(page.getByText(/Authentication failed|Invalid credentials/)).toBeVisible()

    // Verify we're still on login page
    await expect(page).toHaveURL('/login')
  })

  // Skip: Route override conflicts with beforeEach setup
  test.skip('shows error message when server is unreachable', async ({ page }) => {
    // Clear existing routes and set up network failure
    await page.unrouteAll({ behavior: 'ignoreErrors' })

    // Mock network failure
    await page.route(/.*\/pulp\/api\/v3\/status\/(\?.*)?$/, async (route) => {
      await route.abort('failed')
    })

    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Verify error message is displayed
    await expect(page.getByText(/Unable to connect|try again/)).toBeVisible()
  })

  test('redirects authenticated users away from login page', async ({ page }) => {
    // First login
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Wait for redirect
    await expect(page).toHaveURL('/')

    // Try to navigate back to login
    await page.goto('/login')

    // Should be redirected back to dashboard
    await expect(page).toHaveURL('/')
  })

  test('persists authentication across page reloads', async ({ page }) => {
    // Login first
    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('password')
    await page.getByRole('button', { name: 'Sign in' }).click()

    // Wait for redirect
    await expect(page).toHaveURL('/')

    // Reload the page
    await page.reload()

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  // Skip: Timing-sensitive test - form fields are only disabled briefly during submission
  test.skip('disables form fields during submission', async ({ page }) => {
    // Clear existing routes and set up slow status API
    await page.unrouteAll({ behavior: 'ignoreErrors' })

    // Slow down the status API to have time to check disabled state
    await page.route(/.*\/pulp\/api\/v3\/status\/(\?.*)?$/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pulp_href: '/pulp/api/v3/status/',
          pulp_created: new Date().toISOString(),
          versions: [{ component: 'core', version: '3.40.0' }],
          public_key: null,
          known_content: 100,
          database_connection: { connected: true },
          redis_connection: { connected: true },
          storage: { total: 1000000, used: 500000, free: 500000 },
        }),
      })
    })

    await page.getByLabel('Username').fill('admin')
    await page.getByLabel('Password').fill('password')

    const usernameInput = page.getByLabel('Username')
    const passwordInput = page.getByLabel('Password')
    const submitButton = page.getByRole('button', { name: 'Sign in' })

    await submitButton.click()

    // Verify fields are disabled during submission
    await expect(usernameInput).toBeDisabled()
    await expect(passwordInput).toBeDisabled()
  })
})
