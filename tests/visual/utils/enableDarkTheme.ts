import type { Page } from '@playwright/test'

export const enableDarkTheme = async (page: Page) => {
  const hamburger = page.getByTestId('open-mobile-menu-button')

  if (await hamburger.isVisible()) {
    await hamburger.click()
    await page.getByTestId('theme-segmented-control').waitFor({ state: 'visible' })
  }

  await page.getByTestId('set-dark-theme-button').check({ force: true })

  if (await hamburger.isVisible()) {
    await hamburger.click()
    await page.getByTestId('menu').waitFor({ state: 'hidden' })
  }
}
