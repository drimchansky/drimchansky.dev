import { test, expect } from '@playwright/test'

test('Test note (en)', async ({ page }) => {
  await page.goto('/en/notes/test-note')

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})

test('Test-note (ru)', async ({ page }) => {
  await page.goto('/ru/notes/test-note')

  await expect(page).toHaveScreenshot({
    fullPage: true
  })
})
