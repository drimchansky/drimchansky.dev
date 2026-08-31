import { expect, test } from '@playwright/test'

test.describe('Header semantics', () => {
  test('activate the skip link › should move focus to the main landmark', async ({ page }) => {
    await page.goto('/en/')

    await page.keyboard.press('Tab')
    await expect(page.locator('a[href="#main"]')).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()
  })

  test('open a page in the navigation › should mark its link as the current page', async ({ isMobile, page }) => {
    await page.goto('/en/resume/')

    const menu = page.getByTestId('menu')

    if (isMobile) {
      await page.getByTestId('open-mobile-menu-button').click()
      await menu.waitFor({ state: 'visible' })
    }

    await expect(menu).toBeVisible()
    await expect(menu.getByTestId('open-resume-link')).toHaveAttribute('aria-current', 'page')
    await expect(menu.getByTestId('open-notes-link')).not.toHaveAttribute('aria-current')
  })
})
