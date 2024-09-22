import { expect, test } from '@playwright/test'

test.describe('Index page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4321/')
  })

  test('Renders correctly', async ({ page }) => {
    await expect(page).toHaveScreenshot()
  })

  test('Renders correctly after language change', async ({ isMobile, page }) => {
    if (isMobile) {
      await page.getByTestId('menu-button').click()
      await page.getByTestId('switch-lang').click()
    } else {
      await page.getByTestId('switch-lang').click()
    }

    await expect(page).toHaveScreenshot()
  })

  test('Renders correctly after light theme set', async ({ isMobile, page }) => {
    if (isMobile) {
      await page.getByTestId('menu-button').click()
      await page.getByTestId('set-light-theme').click()
    } else {
      await page.getByTestId('set-light-theme').click()
    }

    await expect(page).toHaveScreenshot()
  })

  test('Renders correctly after dark theme set', async ({ isMobile, page }) => {
    if (isMobile) {
      await page.getByTestId('menu-button').click()
      await page.getByTestId('set-dark-theme').click()
    } else {
      await page.getByTestId('set-dark-theme').click()
    }

    await expect(page).toHaveScreenshot()
  })
})
