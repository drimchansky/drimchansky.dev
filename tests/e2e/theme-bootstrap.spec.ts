import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { seedTheme } from './utils/seedTheme'

type BootstrapRecord = { bodyAtFirstClassChange: boolean | null }

const observeFirstRootClassChange = async (page: Page) => {
  await page.addInitScript(() => {
    const record: BootstrapRecord = { bodyAtFirstClassChange: null }
    Object.assign(window, { __themeBootstrap: record })

    // documentElement can still be null at document-start, so observe the document and filter.
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.target !== document.documentElement) continue
        record.bodyAtFirstClassChange = document.body !== null
        observer.disconnect()
        return
      }
    })

    observer.observe(document, { attributeFilter: ['class'], attributes: true, subtree: true })
  })
}

test.describe('Theme bootstrap', () => {
  test('no stored theme › should check the auto radio', async ({ page }) => {
    await page.goto('/en/')

    await expect(page.getByTestId('set-auto-theme-button')).toBeChecked()
  })

  test('a valid stored theme › should apply its class and check its radio', async ({ page }) => {
    await seedTheme(page, 'dark')

    await page.goto('/en/')

    await expect(page.locator('html')).toContainClass('is-dark-theme')
    await expect(page.getByTestId('set-dark-theme-button')).toBeChecked()
  })

  test('an unknown stored theme › should fall back to auto', async ({ page }) => {
    await seedTheme(page, 'chartreuse')

    await page.goto('/en/')

    const html = page.locator('html')
    await expect(html).not.toContainClass('is-dark-theme')
    await expect(html).not.toContainClass('is-light-theme')
    await expect(page.getByTestId('set-auto-theme-button')).toBeChecked()
  })

  test('a stored theme › should apply its class before <body> is parsed', async ({ page }) => {
    await seedTheme(page, 'dark')
    await observeFirstRootClassChange(page)

    await page.goto('/en/')
    await expect(page.locator('html')).toContainClass('is-dark-theme')

    // false means <body> was still unparsed at the first root class change, i.e. the script ran in <head>.
    const record = await page.evaluate(
      () => (window as unknown as { __themeBootstrap: BootstrapRecord }).__themeBootstrap
    )
    expect(record.bodyAtFirstClassChange).toBe(false)
  })
})
