import { expect, test } from '@playwright/test'

import { supportedLocales } from '@/app/i18n'

for (const locale of supportedLocales) {
  test(`Mobile menu (${locale})`, async ({ isMobile, page }) => {
    if (!isMobile) test.skip()

    await page.goto(`/${locale}/`)
    await page.waitForLoadState('networkidle')

    await page.getByTestId('open-mobile-menu-button').click()
    await page.getByTestId('menu').waitFor({ state: 'visible' })

    await expect(page).toHaveScreenshot({ fullPage: true })
  })
}
