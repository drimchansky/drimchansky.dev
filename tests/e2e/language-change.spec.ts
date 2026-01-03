import type { Page } from '@playwright/test'

import { test as base, expect } from '@playwright/test'

import { en } from '@/app/i18n/locales/en'
import { ru } from '@/app/i18n/locales/ru'

type Selectors = {
  html: ReturnType<Page['locator']>
  langSwitchLink: ReturnType<Page['getByTestId']>
  menu: ReturnType<Page['getByTestId']>
  openMobileMenuButton: ReturnType<Page['getByTestId']>
  resumeLink: ReturnType<Page['getByTestId']>
}

const test = base.extend<{ selectors: Selectors }>({
  selectors: async ({ page }, use) => {
    await use({
      html: page.locator('html'),
      langSwitchLink: page.getByTestId('lang-switch-link'),
      menu: page.getByTestId('menu'),
      openMobileMenuButton: page.getByTestId('open-mobile-menu-button'),
      resumeLink: page.getByTestId('menu').getByTestId('open-resume-link')
    })
  }
})

test.beforeEach(async ({ isMobile, page, selectors }) => {
  await page.goto('/en/')

  if (isMobile) {
    await selectors.openMobileMenuButton.click()
  }
})

test.describe('Language change', () => {
  test('click on language switcher › should change the site language to Russian', async ({ page, selectors }) => {
    const { html, langSwitchLink } = selectors

    await langSwitchLink.click()

    await expect(page).toHaveURL(/\/ru\/$/)
    await expect(html).toHaveAttribute('lang', 'ru')
    await expect(langSwitchLink).toContainText(ru.toLocale)
  })

  test('click on language switcher and then reload the page › should maintain the selected language', async ({
    page,
    selectors
  }) => {
    const { html, langSwitchLink } = selectors

    await Promise.all([page.waitForURL(/\/ru\/$/), langSwitchLink.click()])
    await page.reload()

    await expect(page).toHaveURL(/\/ru\/$/)
    await expect(html).toHaveAttribute('lang', 'ru')
    await expect(langSwitchLink).toContainText(ru.toLocale)
  })

  test('click on language switcher and then navigate to another page › should maintain the selected language', async ({
    isMobile,
    page,
    selectors
  }) => {
    const { html, langSwitchLink, openMobileMenuButton, resumeLink } = selectors

    await langSwitchLink.waitFor({ state: 'visible' })
    await langSwitchLink.click()
    await page.waitForURL(/\/ru\/$/)

    if (isMobile) {
      await openMobileMenuButton.click()
    }

    await resumeLink.waitFor({ state: 'visible' })
    await resumeLink.click()
    await page.waitForURL(/\/ru\/resume\/$/)

    await expect(page).toHaveURL(/\/ru\/resume\/$/)
    await expect(html).toHaveAttribute('lang', 'ru')
    await expect(langSwitchLink).toHaveText(ru.toLocale)
  })

  test('click on language switcher twice › should toggle between languages', async ({ isMobile, page, selectors }) => {
    const { html, langSwitchLink, openMobileMenuButton } = selectors

    await langSwitchLink.waitFor({ state: 'visible' })
    await langSwitchLink.click()
    await page.waitForURL(/\/ru\/$/)
    await expect(page).toHaveURL(/\/ru\/$/)
    await expect(html).toHaveAttribute('lang', 'ru')
    await expect(langSwitchLink).toHaveText(ru.toLocale)

    if (isMobile) {
      await openMobileMenuButton.click()
    }

    await langSwitchLink.waitFor({ state: 'visible' })
    await langSwitchLink.click()
    await page.waitForURL(/\/en\/$/)
    await expect(page).toHaveURL(/\/en\/$/)
    await expect(html).toHaveAttribute('lang', 'en')
    await expect(langSwitchLink).toHaveText(en.toLocale)
  })
})
