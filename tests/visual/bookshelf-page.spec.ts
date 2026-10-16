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

  for (const theme of ['light', 'dark'] as const) {
    test(`Bookshelf sampled explanation (${locale}, ${theme})`, async ({ page }) => {
      await page.goto(`/${locale}/bookshelf/`)
      await page.waitForLoadState('networkidle')
      if (theme === 'dark') await enableDarkTheme(page)
      const trigger = page.locator('[data-book-id="test-book-fiction-5-stars"] button[popovertarget]')
      await trigger.click()
      await expect(page.locator('[popover]:popover-open')).toBeVisible()
      await expect(page).toHaveScreenshot()
    })
  }
}

test('Bookshelf page (dark theme)', async ({ page }) => {
  await page.goto('/en/bookshelf')
  await page.waitForLoadState('networkidle')

  await enableDarkTheme(page)

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
