import { expect, test } from '@playwright/test'

import { enableDarkTheme } from './utils/enableDarkTheme'

test('404 page', async ({ page }) => {
  await page.goto('/non-existent-page')
  await page.waitForLoadState('networkidle')

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})

test('404 page (dark theme)', async ({ page }) => {
  await page.goto('/non-existent-page')
  await page.waitForLoadState('networkidle')

  await enableDarkTheme(page)

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
