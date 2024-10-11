import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config()

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] }
    }
  ],
  reporter: 'html',
  retries: process.env.CI ? 2 : 0,
  snapshotDir: './tests/__snapshots__',
  testDir: './tests',
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry'
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm run dev',
    reuseExistingServer: !process.env.CI,
    stderr: 'pipe',
    stdout: 'ignore',
    url: process.env.SITE_URL // env?
  },

  workers: process.env.CI ? 1 : undefined
})
