import type { Page } from '@playwright/test'

export const getFromLocalStorage = async (page: Page, storageKey: string) => {
  return await page.evaluate(key => window.localStorage.getItem(key), storageKey)
}
