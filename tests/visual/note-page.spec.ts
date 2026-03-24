import { expect, test } from '@playwright/test'

import { supportedLocales } from '@/app/i18n'

import { enableDarkTheme } from './utils/enableDarkTheme'

for (const locale of supportedLocales) {
  test(`Note page (${locale})`, async ({ page }) => {
    await page.goto(`/${locale}/notes/content-test`)
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot({
      fullPage: true
    })
  })
}

test('Note page (dark theme)', async ({ page }) => {
  await page.goto('/en/notes/content-test')
  await page.waitForLoadState('networkidle')

  await enableDarkTheme(page)

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
