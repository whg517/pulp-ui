import type { APIRequestContext } from '@playwright/test'

export function getBasicAuthHeader(username: string, password: string): string {
  const credentials = `${username}:${password}`
  const encoded = Buffer.from(credentials).toString('base64')
  return `Basic ${encoded}`
}

export const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin',
} as const

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
