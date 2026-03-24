import { expect, test } from '@playwright/test'

import { supportedLocales } from '@/app/i18n'

import { enableDarkTheme } from './utils/enableDarkTheme'

for (const locale of supportedLocales) {
  test(`Home page (${locale})`, async ({ page }) => {
    await page.goto(`/${locale}/`)
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot({
      fullPage: true
    })
  })
}

test('Home page (dark theme)', async ({ page }) => {
  await page.goto('/en/')
  await page.waitForLoadState('networkidle')

  await enableDarkTheme(page)

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
