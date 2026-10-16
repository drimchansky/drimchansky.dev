import { expect, test } from '@playwright/test'

const triggerId = 'book-estimate-test-book-currently-reading-trigger'
const descriptionId = 'book-estimate-test-book-currently-reading-description'

for (const zoom of ['layout reflow', 'visual zoom'] as const) {
  test(`long Russian explanation remains readable by keyboard at 200% ${zoom}`, async ({
    isMobile,
    page
  }, testInfo) => {
    test.skip(isMobile, 'Desktop zoom has a separate mobile viewport journey')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    if (zoom === 'layout reflow') await page.setViewportSize({ height: 360, width: 640 })
    await page.goto('/ru/bookshelf/')
    const trigger = page.locator('[data-book-id="test-book-fiction-5-stars"] button[popovertarget]')
    await trigger.evaluate(element => window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - 80))
    await trigger.click()
    if (zoom === 'visual zoom') {
      const session = await page.context().newCDPSession(page)
      await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 })
      await expect.poll(() => page.evaluate(() => window.visualViewport?.scale)).toBe(2)
    }
    const panel = page.locator('[popover]:popover-open')
    await expect(panel).toContainText('Синтетическая оценка по выборке')
    await expect(panel.locator('.scroll-hint')).toBeInViewport()
    const isWithinViewport = () =>
      panel.evaluate(element => {
        const rect = element.getBoundingClientRect()
        const view = window.visualViewport
        const left = view?.offsetLeft ?? 0
        const top = view?.offsetTop ?? 0
        return (
          rect.left >= left &&
          rect.top >= top &&
          rect.right <= left + (view?.width ?? window.innerWidth) + 1 &&
          rect.bottom <= top + (view?.height ?? window.innerHeight) + 1
        )
      })
    await expect.poll(isWithinViewport).toBe(true)
    await page.keyboard.press('End')
    await expect(trigger).toBeFocused()
    await expect
      .poll(() => panel.evaluate(element => element.scrollTop + element.clientHeight >= element.scrollHeight - 1))
      .toBe(true)
    await expect
      .poll(() =>
        panel.evaluate(element => {
          const node = element.querySelector('p:last-child')?.firstChild
          if (!node?.textContent) return false
          const range = document.createRange()
          range.selectNodeContents(node)
          range.setStart(node, Math.max(0, node.textContent.length - 20))
          const end = range.getBoundingClientRect()
          const bounds = element.getBoundingClientRect()
          return end.top >= bounds.top && end.bottom <= bounds.bottom
        })
      )
      .toBe(true)
    await page.screenshot({ path: testInfo.outputPath('bookshelf-zoom-200.png') })
  })
}

test('forced colors retain the keyboard focus indicator and readable explanation border', async ({
  page
}, testInfo) => {
  await page.emulateMedia({ forcedColors: 'active' })
  await page.goto('/en/bookshelf/')
  await page.locator('[data-filter="non-fiction"]').focus()
  await page.keyboard.press('Tab')
  const trigger = page.locator(`#${triggerId}`)
  const panel = page.locator(`#${descriptionId}`)
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveCSS('outline-style', 'solid')
  await expect(panel).toBeVisible()
  await expect(panel).toHaveCSS('border-top-style', 'solid')
  await page.screenshot({ path: testInfo.outputPath('bookshelf-forced-colors.png') })
})

for (const locale of ['en', 'ru'] as const) {
  test(`representative estimates retain distinct controls and correct book explanations in ${locale}`, async ({
    page
  }) => {
    await page.goto(`/${locale}/bookshelf/`)
    const buttons = page.locator('[data-page-estimate] button')
    await expect(buttons).toHaveCount(5)
    const ids = await buttons.evaluateAll(nodes => nodes.map(node => node.id))
    expect(new Set(ids).size).toBe(5)
    const descriptions = await buttons.evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-describedby')))
    expect(new Set(descriptions).size).toBe(5)
    await expect(page.locator('[data-book-id="test-book-nonfiction-low"] [data-page-estimate]')).toHaveCount(0)
    await page.locator(`#${triggerId}`).click()
    await expect(page.locator(`#${descriptionId}`)).toContainText(
      locale === 'en' ? 'Synthetic reported word count ÷ 300' : 'Синтетическое заявленное число слов ÷ 300'
    )
    const large = page.locator('[data-book-id="test-book-fiction-half-stars"] button[popovertarget]')
    await expect(large).toHaveText(locale === 'en' ? '≈1,030 pages' : '≈1 030 стр.')
    await large.click()
    const largeDescription = await large.getAttribute('aria-describedby')
    await expect(page.locator(`#${largeDescription}`)).toContainText(
      locale === 'en' ? 'Synthetic full-text word count ÷ 300' : 'Синтетический подсчёт слов полного текста ÷ 300'
    )
    await expect(page.locator(`#${descriptionId}`)).not.toBeVisible()
    await page.keyboard.press('Escape')
    const combined = page.locator('[data-book-id="test-book-nonfiction-high"] button[popovertarget]')
    await expect(combined).toHaveText(locale === 'en' ? '≈10 pages' : '≈10 стр.')
    await combined.click()
    await expect(page.locator('[popover]:popover-open')).toContainText(
      locale === 'en' ? '2 distinct works' : '2 отдельных произведений'
    )
    await page.keyboard.press('Escape')
    const short = page.locator('[data-book-id="test-book-skipped"] button[popovertarget]')
    await expect(short).toHaveText(locale === 'en' ? '<10 pages' : '<10 стр.')
    await short.click()
    await expect(page.locator('[popover]:popover-open')).toContainText(
      locale === 'en' ? 'including the unread remainder' : 'включая непрочитанную часть'
    )
  })
}

test('first click reaches a centered estimate trigger while its hover explanation opens', async ({
  isMobile,
  page
}) => {
  test.skip(isMobile, 'Hover applies to devices with a hovering pointer')
  await page.setViewportSize({ height: 800, width: 1280 })
  await page.goto('/en/bookshelf/')
  await page.evaluate(() => document.fonts.ready)
  const trigger = page.locator('[data-book-id="test-book-fiction-half-stars"] button[popovertarget]')
  await trigger.evaluate(button => button.scrollIntoView({ behavior: 'instant', block: 'center' }))
  const bounds = await trigger.boundingBox()
  if (!bounds) throw new Error('The estimate trigger has no visible bounds')
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  expect(Math.abs(y - 400)).toBeLessThan(1)
  await trigger.evaluate(button => {
    const wrapper = button.closest<HTMLElement>('[data-page-estimate]')
    wrapper?.addEventListener(
      'pointerenter',
      () => {
        const rect = button.getBoundingClientRect()
        const target = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
        wrapper.dataset.firstHoverReachesTrigger = String(target === button || button.contains(target))
      },
      { once: true }
    )
  })
  await page.mouse.click(x, y)
  await expect(trigger.locator('..')).toHaveAttribute('data-first-hover-reaches-trigger', 'true')
  await expect(trigger).toBeFocused()
  const panel = page.locator(`#${await trigger.getAttribute('aria-describedby')}`)
  await expect(panel).toBeVisible()
  await page.mouse.move(5, 5)
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('hover persists while the pointer enters the explanation and closes after leaving', async ({ isMobile, page }) => {
  test.skip(isMobile, 'Hover applies to devices with a hovering pointer')
  await page.goto('/en/bookshelf/')
  const panel = page.locator(`#${descriptionId}`)
  await page.locator(`#${triggerId}`).hover()
  await expect(panel).toBeVisible()
  await panel.hover()
  await expect(panel).toBeVisible()
  await page.mouse.move(5, 5)
  await expect(panel).not.toBeVisible()
})

test('keyboard focus reopens an explanation after its hover dismissal', async ({ isMobile, page }) => {
  test.skip(isMobile, 'Hover applies to devices with a hovering pointer')
  await page.goto('/en/bookshelf/')
  const trigger = page.locator(`#${triggerId}`)
  const panel = page.locator(`#${descriptionId}`)
  await trigger.hover()
  await expect(panel).toBeVisible()
  await page.mouse.move(5, 5)
  await expect(panel).not.toBeVisible()
  await page.locator('[data-filter="non-fiction"]').focus()
  await page.keyboard.press('Tab')
  await expect(trigger).toBeFocused()
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(trigger).toBeFocused()
  await expect(panel).toBeVisible()
})

test('keyboard focus explains the estimate and Escape dismisses without reopening or moving focus', async ({
  page
}) => {
  await page.goto('/en/bookshelf/')
  const trigger = page.locator(`#${triggerId}`)
  const panel = page.locator(`#${descriptionId}`)
  await page.locator('[data-filter="non-fiction"]').focus()
  await page.keyboard.press('Tab')
  await expect(trigger).toBeFocused()
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(panel).not.toBeVisible()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(panel).toBeVisible()
})

test('first click or tap opens an anchored explanation and preserves trigger focus', async ({ isMobile, page }) => {
  await page.goto('/en/bookshelf/')
  const trigger = page.locator(`#${triggerId}`)
  const panel = page.locator(`#${descriptionId}`)
  if (isMobile) await trigger.tap()
  else await trigger.click()
  await expect(panel).toBeVisible()
  await expect(trigger).toBeFocused()
  const bounds = await panel.boundingBox()
  if (!bounds) throw new Error('The explanation has no visible bounds')
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(await page.evaluate(() => window.innerWidth))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.mouse.click(5, 5)
  await expect(panel).not.toBeVisible()
  await trigger.click()
  await expect(panel).toBeVisible()
  await trigger.click()
  await expect(panel).not.toBeVisible()
})

test('filtering a row away closes its explanation, including a filter-state update without a click', async ({
  page
}) => {
  await page.goto('/en/bookshelf/')
  const trigger = page.locator(`#${triggerId}`)
  const panel = page.locator(`#${descriptionId}`)
  await trigger.click()
  await page.evaluate(() => {
    document.documentElement.dataset.typeFilter = 'non-fiction'
  })
  await expect(trigger).not.toBeVisible()
  await expect(panel).not.toBeVisible()
  await page.locator('[data-filter="all"]').click()
  await trigger.click()
  await expect(panel).toBeVisible()
  await page.locator('[data-filter="non-fiction"]').click()
  await expect(panel).not.toBeVisible()
})

test('locale navigation and back navigation leave no stale explanation or duplicate controls', async ({
  isMobile,
  page
}) => {
  const errors: string[] = []
  page.on('pageerror', error => {
    const isMobileTransitionSkip = isMobile && error.message === 'Transition was skipped. skipTransition() called'
    if (!isMobileTransitionSkip) errors.push(error.message)
  })
  await page.goto('/en/bookshelf/?type=fiction')
  await page.locator(`#${triggerId}`).click()
  if (isMobile) await page.getByRole('button', { exact: true, name: 'Menu' }).click()
  await page.locator('a[hreflang="ru"]').click()
  await expect(page).toHaveURL(/\/ru\/bookshelf\/$/)
  await expect(page.locator('[popover]:popover-open')).toHaveCount(0)
  await expect(page.locator(`#${triggerId}`)).toHaveCount(1)
  await expect(page.locator(`#${descriptionId}`)).toHaveCount(1)
  await page.locator(`#${triggerId}`).click()
  await expect(page.locator(`#${descriptionId}`)).toContainText('Синтетическое заявленное число слов ÷ 300')
  if (isMobile) await page.getByRole('button', { exact: true, name: 'Меню' }).click()
  await page.locator('a[href="/ru/"]').first().click()
  await expect(page).toHaveURL(/\/ru\/$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/ru\/bookshelf\/$/)
  await expect(page.locator('[popover]:popover-open')).toHaveCount(0)
  await page.locator(`#${triggerId}`).click()
  await expect(page.locator(`#${descriptionId}`)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator(`#${descriptionId}`)).not.toBeVisible()
  expect(errors).toEqual([])
})

test('native estimate button opens and dismisses without enhancement JavaScript', async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: page.viewportSize() })
  const nativePage = await context.newPage()
  await nativePage.goto(new URL('/en/bookshelf/', process.env.SITE_URL).href)
  const trigger = nativePage.locator(`#${triggerId}`)
  const panel = nativePage.locator(`#${descriptionId}`)
  await expect(trigger).toHaveAttribute('aria-describedby', descriptionId)
  await expect(panel).not.toBeVisible()
  await trigger.click()
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('Synthetic reported word count ÷ 300')
  await expect(panel.locator('a, button, [tabindex]')).toHaveCount(0)
  await nativePage.keyboard.press('Escape')
  await expect(panel).not.toBeVisible()
  await trigger.click()
  await expect(panel).toBeVisible()
  await nativePage.mouse.click(5, 5)
  await expect(panel).not.toBeVisible()
  await context.close()
})
