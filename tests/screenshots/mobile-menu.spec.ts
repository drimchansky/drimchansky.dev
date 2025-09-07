import { test, expect } from '@playwright/test'

test('Mobile menu (en)', async ({ isMobile, page }) => {
  if (!isMobile) test.skip()

  await page.goto('/en')

  const hamburger = page.getByTestId('open-mobile-menu-button')
  await hamburger.click()

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})

test('Mobile menu (ru)', async ({ isMobile, page }) => {
  if (!isMobile) test.skip()

  await page.goto('/ru')

  const hamburger = page.getByTestId('open-mobile-menu-button')
  await hamburger.click()

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
