import { type Page, expect, test } from '@playwright/test'

import { supportedLocales } from '@/app/i18n'

const stubDurations = (page: Page) =>
  page.getByTestId('resume-item-duration').evaluateAll(elements => {
    for (const el of elements) el.textContent = '(0 years 0 months)'
  })

for (const locale of supportedLocales) {
  test(`Resume page (${locale})`, async ({ page }) => {
    await page.goto(`/${locale}/resume`)
    await page.waitForLoadState('networkidle')
    await stubDurations(page)

    await expect(page).toHaveScreenshot({
      fullPage: true
    })
  })
}

test('Resume page (dark theme)', async ({ page }) => {
  await page.goto('/en/resume')
  await page.waitForLoadState('networkidle')

  const hamburger = page.getByTestId('open-mobile-menu-button')

  if (await hamburger.isVisible()) {
    await hamburger.click()
    await page.getByTestId('theme-segmented-control').waitFor({ state: 'visible' })
  }

  await page.getByTestId('set-dark-theme-button').check({ force: true })

  if (await hamburger.isVisible()) {
    await hamburger.click()
    await page.getByTestId('menu').waitFor({ state: 'hidden' })
  }

  await stubDurations(page)

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
