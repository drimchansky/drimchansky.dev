import { type Page, expect, test } from '@playwright/test'

import { supportedLocales } from '@/app/i18n'

import { enableDarkTheme } from './utils/enableDarkTheme'

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

  await enableDarkTheme(page)

  await stubDurations(page)

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
