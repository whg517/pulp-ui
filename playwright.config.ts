import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'

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
    baseURL: 'http://localhost:5174',
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
  webServer: {
    command: 'E2E_TEST=1 bun dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
