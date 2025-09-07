import { test, expect } from '@playwright/test'

test('Resume (en)', async ({ page }) => {
  await page.goto('/en/resume')
  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})

test('Resume (ru)', async ({ page }) => {
  await page.goto('/ru/resume')
  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
