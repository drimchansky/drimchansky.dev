import { expect, test } from '@playwright/test'

import { supportedLocales } from '@/app/i18n'

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

  const hamburger = page.getByTestId('open-mobile-menu-button')

  if (await hamburger.isVisible()) {
    await hamburger.click()
    await page.getByTestId('theme-segmented-control').waitFor({ state: 'visible' })
  }

  await page.getByTestId('set-dark-theme-button').check({ force: true })

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
