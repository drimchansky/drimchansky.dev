import type { Page } from '@playwright/test'

import { test as base, expect } from '@playwright/test'

import { colorThemeValues, THEME_STORAGE_KEY } from '@/features/theme-switch/constants'

import { getFromLocalStorage } from './utils/getFromLocalStorage'

type Selectors = {
  html: ReturnType<Page['locator']>
  openMobileMenuButton: ReturnType<Page['getByTestId']>
  openResumeLink: ReturnType<Page['getByTestId']>
  setAutoThemeButton: ReturnType<Page['getByTestId']>
  setDarkThemeButton: ReturnType<Page['getByTestId']>
  themeSegmentedControl: ReturnType<Page['getByTestId']>
}

const test = base.extend<{ selectors: Selectors }>({
  selectors: async ({ page }, use) => {
    await use({
      html: page.locator('html'),
      openMobileMenuButton: page.getByTestId('open-mobile-menu-button'),
      openResumeLink: page.getByTestId('menu').getByTestId('open-resume-link'),
      setAutoThemeButton: page.getByTestId('theme-segmented-control').getByTestId('set-auto-theme-button'),
      setDarkThemeButton: page.getByTestId('theme-segmented-control').getByTestId('set-dark-theme-button'),
      themeSegmentedControl: page.getByTestId('theme-segmented-control')
    })
  }
})

test.beforeEach(async ({ isMobile, page, selectors }) => {
  await page.goto('/en')

  if (isMobile) {
    await selectors.openMobileMenuButton.click()
  }
})

test.describe('Color theme change', () => {
  test("opened first time website › shouldn't have theme classes or local storage value", async ({
    page,
    selectors
  }) => {
    const { html } = selectors

    await expect(html).not.toContainClass('is-dark-theme')
    await expect(html).not.toContainClass('is-light-theme')
    expect(await getFromLocalStorage(page, THEME_STORAGE_KEY)).toBeNull()
  })

  colorThemeValues
    .filter(value => value !== 'auto')
    .forEach(colorThemeValue => {
      test(`click on the "${colorThemeValue}" radio button › should change the site color theme to ${colorThemeValue}`, async ({
        page,
        selectors
      }) => {
        const { html, themeSegmentedControl } = selectors
        const themeButton = themeSegmentedControl.getByTestId(`set-${colorThemeValue}-theme-button`)

        await themeButton.click()

        await expect(html).toContainClass(`is-${colorThemeValue}-theme`)
        expect(await getFromLocalStorage(page, THEME_STORAGE_KEY)).toBe(colorThemeValue)
      })
    })

  test('click on the "dark" and then on the "auto" radio button › should change the site color theme to auto', async ({
    page,
    selectors
  }) => {
    const { html, setAutoThemeButton, setDarkThemeButton } = selectors

    await setDarkThemeButton.click()
    await setAutoThemeButton.click()

    await expect(html).not.toHaveClass('is-light-theme')
    await expect(html).not.toHaveClass('is-dark-theme')
    expect(await getFromLocalStorage(page, THEME_STORAGE_KEY)).toBe('auto')
  })

  test('click on the "dark" radio button and then reload the page › should consists the selected theme', async ({
    page,
    selectors
  }) => {
    const { html, setDarkThemeButton } = selectors

    await setDarkThemeButton.click()
    await page.reload()

    await expect(html).toHaveClass('is-dark-theme')
    expect(await getFromLocalStorage(page, THEME_STORAGE_KEY)).toBe('dark')
  })

  test('click on the "dark" radio button and then going to the other page › should consists the selected theme', async ({
    page,
    selectors
  }) => {
    const { html, openResumeLink, setDarkThemeButton } = selectors

    await setDarkThemeButton.click()
    await openResumeLink.click()

    await expect(html).toHaveClass('is-dark-theme')
    expect(await getFromLocalStorage(page, THEME_STORAGE_KEY)).toBe('dark')
  })
})
