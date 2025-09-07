import { test, expect } from '@playwright/test'

test('Notes (en)', async ({ page }) => {
  await page.goto('/en/notes')
  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})

test('Notes (ru)', async ({ page }) => {
  await page.goto('/ru/notes')
  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
