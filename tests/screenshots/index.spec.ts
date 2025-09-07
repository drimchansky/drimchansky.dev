import { test, expect } from '@playwright/test'

test('Homepage (en)', async ({ page }) => {
  await page.goto('/en')
  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})

test('Homepage (ru)', async ({ page }) => {
  await page.goto('/ru')
  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
