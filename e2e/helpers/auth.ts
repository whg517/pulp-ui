import type { APIRequestContext, Page } from '@playwright/test'

/**
 * Generates a Basic Authentication header value
 * @param username - The username for authentication
 * @param password - The password for authentication
 * @returns The Basic Auth header string (e.g., "Basic dXNlcjpwYXNz")
 */
export function getBasicAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`
  const encoded = Buffer.from(credentials).toString('base64')
  return `Basic ${encoded}`
}

/**
 * Default test credentials for Pulp API authentication
 */
export const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin',
} as const

/**
 * Authenticates via the Pulp REST API using Basic Auth
 * @param request - Playwright APIRequestContext instance
 * @throws Error if authentication fails (non-200 response)
 */
export async function loginViaAPI(request: APIRequestContext): Promise<void> {
  const authHeader = getBasicAuthHeader(TEST_CREDENTIALS.username, TEST_CREDENTIALS.password)
  const response = await request.get('/pulp/api/v3/status/', {
    headers: {
      Authorization: authHeader,
    },
  })

  if (response.status() !== 200) {
    throw new Error(`Authentication failed: received status ${response.status()}`)
  }
}

/**
 * Authenticates via the UI login form
 * @param page - Playwright Page instance
 */
export async function loginViaUI(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Username').fill(TEST_CREDENTIALS.username)
  await page.getByLabel('Password').fill(TEST_CREDENTIALS.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL('/')
}
