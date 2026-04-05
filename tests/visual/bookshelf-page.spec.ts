import { expect, test } from '@playwright/test'

import { supportedLocales } from '@/app/i18n'

import { enableDarkTheme } from './utils/enableDarkTheme'

for (const locale of supportedLocales) {
  test(`Bookshelf page (${locale})`, async ({ page }) => {
    await page.goto(`/${locale}/bookshelf`)
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot({
      fullPage: true
    })
  })
}

test('Bookshelf page (dark theme)', async ({ page }) => {
  await page.goto('/en/bookshelf')
  await page.waitForLoadState('networkidle')

  await enableDarkTheme(page)

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
