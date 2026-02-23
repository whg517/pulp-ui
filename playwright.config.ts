import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const isContainerized = process.env.E2E_CONTAINERIZED === 'true'

const baseURL = isContainerized
  ? process.env.PLAYWRIGHT_BASE_URL || 'http://ui:5173'
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
  globalSetup: fileURLToPath(new URL('./e2e/global-setup.ts', import.meta.url)),
  globalTeardown: fileURLToPath(new URL('./e2e/global-teardown.ts', import.meta.url)),
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
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
  ...(isContainerized
    ? {}
    : {
        webServer: {
          command: 'E2E_TEST=1 bun dev',
          url: 'http://localhost:5174',
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
        },
      }),
})
