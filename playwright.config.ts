import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '.env') })

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
  testDir: './tests',

  use: {
    actionTimeout: 30000,
    baseURL: process.env.SITE_URL,
    navigationTimeout: 30000,
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry'
  },

  webServer: {
    command: 'pnpm dev',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
    url: process.env.SITE_URL
  },

  workers: process.env.CI ? 1 : undefined
})
