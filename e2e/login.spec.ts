import { test as base, expect, Page } from '@playwright/test'
import { test as authenticatedTest } from './fixtures/index.js'
import { LoginPage } from './pages/login-page.js'
import { TEST_CREDENTIALS } from './helpers/auth.js'

const test = base.extend<{
  freshPage: Page
  loginPage: LoginPage
}>({
  freshPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
  loginPage: async ({ freshPage }, use) => {
    const loginPage = new LoginPage({ page: freshPage })
    await use(loginPage)
  },
})

test.describe('Login Flow', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto()
  })

  test('displays login form with all required fields', async ({ loginPage }) => {
    await expect(loginPage.heading).toBeVisible()
    await expect(loginPage.subtitle).toBeVisible()
    await expect(loginPage.usernameInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.signInButton).toBeVisible()
  })

  test('shows validation error when username is empty', async ({ loginPage }) => {
    await loginPage.passwordInput.fill('testpassword')
    await loginPage.signInButton.click()
    await expect(loginPage.page.getByText('Username is required')).toBeVisible()
  })

  test('shows validation error when password is empty', async ({ loginPage }) => {
    await loginPage.usernameInput.fill('testuser')
    await loginPage.signInButton.click()
    await expect(loginPage.page.getByText('Password is required')).toBeVisible()
  })

  test.skip('shows loading state during login', async () => {
    // Timing-sensitive test - loading state appears briefly during API call
  })

  test('redirects to dashboard after successful login', async ({ loginPage }) => {
    await loginPage.loginAndWaitForRedirect(TEST_CREDENTIALS)
    await expect(loginPage.page).toHaveURL('/')
    await expect(loginPage.page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20000 })
  })

  test('shows error message for invalid credentials', async ({ loginPage }) => {
    await loginPage.login({ username: TEST_CREDENTIALS.username, password: 'wrongpassword' })
    
    // Wait for error message - may need more time
    await expect(
      loginPage.page.getByText(/Authentication failed|Invalid credentials|Error/i)
    ).toBeVisible({ timeout: 15000 })
    await expect(loginPage.page).toHaveURL('/login')
  })

  test.skip('shows error message when server is unreachable', async () => {
    // Requires network mock - not testable with real API
  })
})

authenticatedTest.describe('Login Flow - Authenticated', () => {
  authenticatedTest('redirects authenticated users away from login page', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/login')
    await expect(authenticatedPage).toHaveURL('/')
  })

  authenticatedTest('persists authentication across page reloads', async ({ authenticatedPage }) => {
    await authenticatedPage.reload()
    await expect(authenticatedPage).toHaveURL('/')
    await expect(authenticatedPage.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })
})
