import type { Page } from '@playwright/test'

import { THEME_STORAGE_KEY } from '@/shared/constants'

export const seedTheme = async (page: Page, value: string) => {
  await page.addInitScript(
    ({ key, theme }) => {
      window.localStorage.setItem(key, theme)
    },
    { key: THEME_STORAGE_KEY, theme: value }
  )
}
