import { expect, test } from '@playwright/test'

test.describe('Index page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:4321/')
  })

  test.afterEach(async ({ page }) => {
    await expect(page).toHaveScreenshot({ fullPage: true })
  })

  test('Renders correctly', async () => {})

  test('Renders correctly after language change', async ({ isMobile, page }) => {
    if (isMobile) {
      await page.getByTestId('menu-button').click()
      await page.getByTestId('switch-lang').click()
    } else {
      await page.getByTestId('switch-lang').click()
    }
  })

  test('Renders correctly after light theme set', async ({ isMobile, page }) => {
    if (isMobile) {
      await page.getByTestId('menu-button').click()
      await page.getByTestId('set-light-theme').click()
      await page.getByTestId('menu-button').click()
    } else {
      await page.getByTestId('set-light-theme').click()
    }
  })

  test('Renders correctly after dark theme set', async ({ isMobile, page }) => {
    if (isMobile) {
      await page.getByTestId('menu-button').click()
      await page.getByTestId('set-dark-theme').click()
      await page.getByTestId('menu-button').click()
    } else {
      await page.getByTestId('set-dark-theme').click()
    }
  })
})