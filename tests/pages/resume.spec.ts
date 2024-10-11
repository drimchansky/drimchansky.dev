import { expect, test } from '@playwright/test'

import { configureSnapshotPath } from '@/utils/functions/configureSnapshotPath'

// eslint-disable-next-line no-empty-pattern
test.beforeEach(async ({}, testInfo) => {
  testInfo.snapshotPath = configureSnapshotPath(testInfo)
})

test.describe('Resume page page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4321/en/resume/')
  })

  test.afterEach(async ({ page }) => {
    await expect(page).toHaveScreenshot({ fullPage: true })
  })

  test('Renders correctly', async () => {})

  test('Renders correctly after language change', async ({ isMobile, page }) => {
    if (isMobile) {
      await page.getByTestId('menu-button').click()
      await page.getByTestId('switch-lang').click()
    } else {
      await page.getByTestId('switch-lang').click()
    }
  })

  test('Renders correctly after light theme set', async ({ isMobile, page }) => {
    if (isMobile) {
      await page.getByTestId('menu-button').click()
      await page.getByTestId('set-light-theme').click()
      await page.getByTestId('menu-button').click()
    } else {
      await page.getByTestId('set-light-theme').click()
    }
  })

  test('Renders correctly after dark theme set', async ({ isMobile, page }) => {
    if (isMobile) {
      await page.getByTestId('menu-button').click()
      await page.getByTestId('set-dark-theme').click()
      await page.getByTestId('menu-button').click()
    } else {
      await page.getByTestId('set-dark-theme').click()
    }
  })

  test('Renders correctly when menu is opened', async ({ isMobile, page }) => {
    if (isMobile) {
      await page.getByTestId('menu-button').click()
    } else test.skip()
  })
})
