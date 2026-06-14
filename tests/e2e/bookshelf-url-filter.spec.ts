import type { ConsoleMessage, Locator } from '@playwright/test'

import { expect, test as base } from '@playwright/test'

type Fixtures = {
  consoleErrors: string[]
  selectors: {
    allButton: Locator
    fictionButton: Locator
    html: Locator
    nonFictionButton: Locator
    visibleFiction: Locator
    visibleNonFiction: Locator
  }
}

const test = base.extend<Fixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = []
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', error => errors.push(error.message))
    await use(errors)
  },
  selectors: async ({ page }, use) => {
    await use({
      allButton: page.locator('[data-filter="all"]'),
      fictionButton: page.locator('[data-filter="fiction"]'),
      html: page.locator('html'),
      nonFictionButton: page.locator('[data-filter="non-fiction"]'),
      visibleFiction: page.locator('[data-type="fiction"]:visible'),
      visibleNonFiction: page.locator('[data-type="non-fiction"]:visible')
    })
  }
})

test.describe('Bookshelf URL filter', () => {
  // URL → view (hydrate on load)
  test('?type=fiction shows only fiction with Fiction pressed and no console error', async ({
    consoleErrors,
    page,
    selectors
  }) => {
    const { fictionButton, html, visibleFiction, visibleNonFiction } = selectors

    await page.goto('/en/bookshelf?type=fiction')

    await expect(html).toHaveAttribute('data-type-filter', 'fiction')
    await expect(fictionButton).toHaveAttribute('aria-pressed', 'true')
    await expect(visibleNonFiction).toHaveCount(0)
    expect(await visibleFiction.count()).toBeGreaterThan(0)
    expect(consoleErrors).toEqual([])
  })

  test('?type=non-fiction shows only non-fiction with Non-fiction pressed', async ({
    consoleErrors,
    page,
    selectors
  }) => {
    const { html, nonFictionButton, visibleFiction, visibleNonFiction } = selectors

    await page.goto('/en/bookshelf?type=non-fiction')

    await expect(html).toHaveAttribute('data-type-filter', 'non-fiction')
    await expect(nonFictionButton).toHaveAttribute('aria-pressed', 'true')
    await expect(visibleFiction).toHaveCount(0)
    expect(await visibleNonFiction.count()).toBeGreaterThan(0)
    expect(consoleErrors).toEqual([])
  })

  // No param, ?type=all, and unknown values all resolve to the "All" view.
  for (const query of ['', '?type=all', '?type=banana']) {
    test(`"${query || 'no param'}" shows all books with All pressed`, async ({ consoleErrors, page, selectors }) => {
      const { allButton, html, visibleFiction, visibleNonFiction } = selectors

      await page.goto(`/en/bookshelf${query}`)

      await expect(html).not.toHaveAttribute('data-type-filter')
      await expect(allButton).toHaveAttribute('aria-pressed', 'true')
      expect(await visibleFiction.count()).toBeGreaterThan(0)
      expect(await visibleNonFiction.count()).toBeGreaterThan(0)
      expect(consoleErrors).toEqual([])
    })
  }

  // View → URL (write on click)
  test('clicking filters writes the URL via replaceState and All clears the param', async ({ page, selectors }) => {
    const { allButton, fictionButton, html, nonFictionButton, visibleNonFiction } = selectors

    await page.goto('/en/')
    await page.goto('/en/bookshelf')
    const historyLengthBefore = await page.evaluate(() => window.history.length)

    await fictionButton.click()
    await expect(page).toHaveURL(/\/en\/bookshelf\/?\?type=fiction$/)
    await expect(fictionButton).toHaveAttribute('aria-pressed', 'true')
    await expect(visibleNonFiction).toHaveCount(0)

    await nonFictionButton.click()
    await expect(page).toHaveURL(/\/en\/bookshelf\/?\?type=non-fiction$/)

    await allButton.click()
    await expect(page).toHaveURL(/\/en\/bookshelf\/?$/)
    await expect(html).not.toHaveAttribute('data-type-filter')

    // replaceState, not pushState: no per-toggle history entries.
    expect(await page.evaluate(() => window.history.length)).toBe(historyLengthBefore)

    // Back leaves the bookshelf rather than stepping through filter states.
    await page.goBack()
    await expect(page).toHaveURL(/\/en\/?$/)
  })

  // Share round-trip + history restore on a full Back navigation.
  test('a shared filtered link reopens filtered, and Back restores it', async ({ page, selectors }) => {
    const { html, nonFictionButton, visibleFiction } = selectors

    await page.goto('/en/bookshelf?type=non-fiction')
    await expect(nonFictionButton).toHaveAttribute('aria-pressed', 'true')
    await expect(visibleFiction).toHaveCount(0)

    await page.goto('/en/')
    await page.goBack()

    await expect(page).toHaveURL(/\/en\/bookshelf\/?\?type=non-fiction$/)
    await expect(html).toHaveAttribute('data-type-filter', 'non-fiction')
    await expect(nonFictionButton).toHaveAttribute('aria-pressed', 'true')
    await expect(visibleFiction).toHaveCount(0)
  })

  // ClientRouter view-transition nav away, then Back → astro:after-swap re-syncs.
  test('Back after a ClientRouter navigation restores the filtered view', async ({ isMobile, page, selectors }) => {
    const { html, nonFictionButton, visibleFiction } = selectors

    await page.goto('/en/bookshelf')
    await nonFictionButton.click()
    await expect(page).toHaveURL(/\?type=non-fiction$/)

    if (isMobile) {
      await page.getByTestId('open-mobile-menu-button').click()
    }
    await page.getByTestId('menu').getByTestId('open-resume-link').click()
    await expect(page).toHaveURL(/\/en\/resume\/?$/)

    await page.goBack()

    await expect(page).toHaveURL(/\/en\/bookshelf\/?\?type=non-fiction$/)
    await expect(html).toHaveAttribute('data-type-filter', 'non-fiction')
    await expect(nonFictionButton).toHaveAttribute('aria-pressed', 'true')
    await expect(visibleFiction).toHaveCount(0)
  })
})
