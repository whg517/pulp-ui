import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'

// Containerized mode: Run tests against containerized UI service
// Set E2E_CONTAINERIZED=true to enable
const isContainerized = process.env.E2E_CONTAINERIZED === 'true'

// Base URL: Use containerized UI service or local dev server
const baseURL = isContainerized
  ? (process.env.PLAYWRIGHT_BASE_URL || 'http://ui:5173')
  : 'http://localhost:5174'

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: fileURLToPath(new URL('./e2e/globalSetup.ts', import.meta.url)),
  globalTeardown: fileURLToPath(new URL('./e2e/globalTeardown.ts', import.meta.url)),
  use: {
    baseURL,
    // Note: storageState is NOT set globally to allow login tests to work
    // Tests that need authentication should use the authenticatedPage fixture
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Only run firefox and webkit in local development for faster CI
    ...(process.env.CI
      ? []
      : [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
        ]),
  ],
  // In containerized mode, the UI service is managed by docker-compose
  // In local mode, start the dev server via webServer
  ...(isContainerized
    ? {}
    : {
        webServer: {
          command: 'E2E_TEST=1 bun dev',
          url: 'http://localhost:5174',
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      }),
})
