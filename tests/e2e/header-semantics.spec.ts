import { expect, test } from '@playwright/test'

test.describe('Header semantics', () => {
  test('activate the skip link › should move focus to the main landmark', async ({ page }) => {
    await page.goto('/en/')

    await page.keyboard.press('Tab')
    await expect(page.locator('a[href="#main"]')).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page.locator('#main')).toBeFocused()
  })

  test('press Escape with the menu open › should close it and return focus to the hamburger', async ({
    isMobile,
    page
  }) => {
    if (!isMobile) test.skip()

    await page.goto('/en/')

    const button = page.getByTestId('open-mobile-menu-button')
    const main = page.locator('#main')
    const skipLink = page.locator('a[href="#main"]')

    await button.click()

    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(main).toHaveAttribute('inert', '')
    // The skip link sits outside both #header (the trap root) and #main, so #main going inert
    // does not reach it; without its own inert it stays a live control pointing at a dead target.
    await expect(skipLink).toHaveAttribute('inert', '')

    // The focus trap is imported on the first open and its Escape listener registers only once
    // that chunk lands, so an early key press is dropped; retry until the menu actually closes.
    await expect(async () => {
      await page.keyboard.press('Escape')
      await expect(button).toHaveAttribute('aria-expanded', 'false', { timeout: 1000 })
    }).toPass()

    await expect(main).not.toHaveAttribute('inert')
    await expect(skipLink).not.toHaveAttribute('inert')
    await expect(button).toBeFocused()
  })

  test('navigate with the menu open › should release the page lock before the swap', async ({ isMobile, page }) => {
    if (!isMobile) test.skip()

    await page.goto('/en/')

    // The swap replaces <html>, #main and the header, so nothing observed after navigation can
    // distinguish a handler that ran from one that never fired. Sample the release from inside
    // the swap instead; the header registers its own listener at module load, so it runs first.
    await page.evaluate(() => {
      document.addEventListener('astro:before-swap', () => {
        Object.assign(window, {
          __atSwap: {
            clip: document.documentElement.classList.contains('clip'),
            expanded: document.getElementById('hamburger-button')?.getAttribute('aria-expanded'),
            mainInert: document.getElementById('main')?.hasAttribute('inert')
          }
        })
      })
    })

    await page.getByTestId('open-mobile-menu-button').click()
    await expect(page.locator('#main')).toHaveAttribute('inert', '')

    await page.getByTestId('menu').getByTestId('open-resume-link').click()
    await page.waitForURL('**/resume/**')

    expect(await page.evaluate(() => (window as never as { __atSwap: unknown }).__atSwap)).toEqual({
      clip: false,
      expanded: 'false',
      mainInert: false
    })
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
