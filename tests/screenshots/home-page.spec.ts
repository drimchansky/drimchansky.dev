import { test, expect } from '@playwright/test'

test('homepage screenshot', async ({ page }) => {
  await page.goto('/en')
  await expect(page).toHaveScreenshot()
})
