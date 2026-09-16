import { expect, test } from '@playwright/test'

import { t } from '@/app/i18n'

test.describe('Markdown alternates', () => {
  test('every sitemap page advertises a working Markdown twin', async ({ page, request }) => {
    const sitemap = await request.get('/sitemap-0.xml')
    expect(sitemap.ok()).toBe(true)
    const pages = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => new URL(url).pathname)
    expect(pages.length).toBeGreaterThan(0)

    for (const path of pages) {
      await test.step(path, async () => {
        await page.goto(path)

        const href = await page.locator('link[rel="alternate"][type="text/markdown"]').getAttribute('href')
        expect(href).toMatch(/\.md$/)

        const locale = path.split('/')[1]
        const pointer = page.locator('body > div.sr-only[aria-hidden="true"]')
        await expect(pointer).toHaveText(t(locale, 'markdownPointer').replace('{url}', href!))

        const markdown = await request.get(new URL(href!).pathname)
        expect(markdown.ok()).toBe(true)
        expect(markdown.headers()['content-type']).toContain('text/markdown')
        expect(await markdown.text()).toMatch(/^# .+\n\n/)
      })
    }
  })

  test('open the 404 page › should not advertise a Markdown twin', async ({ page }) => {
    await page.goto('/en/missing/')

    await expect(page.locator('link[rel="alternate"][type="text/markdown"]')).toHaveCount(0)
    await expect(page.locator('body > div.sr-only[aria-hidden="true"]')).toHaveCount(0)
  })

  test('fetch a note as Markdown › should carry the metadata, clean headings and built image URLs', async ({
    baseURL,
    request
  }) => {
    const text = await (await request.get('/en/notes/content-test.md')).text()

    expect(text).toContain(
      [
        '# Content Test',
        '',
        '> A test note combining all possible content elements for visual regression testing.',
        '',
        '- Published: 2020-01-01',
        '- Updated: 2020-06-15',
        '- Language: en',
        `- Canonical: ${baseURL}/en/notes/content-test/`
      ].join('\n')
    )
    expect(text).toContain('\n## Heading 2\n')
    expect(text).not.toMatch(/\[#[a-z0-9-]+]/)
    expect(text).toMatch(
      new RegExp(`!\\[A vibe coding meme]\\(${baseURL}/_astro/vibe-coding-is-not-an-excuse_meme\\.[\\w-]+\\.jpg\\)`)
    )
  })

  test('fetch llms.txt › should point at the Markdown pages and the full-content file', async ({
    baseURL,
    request
  }) => {
    const response = await request.get('/llms.txt')
    const text = await response.text()

    expect(response.ok()).toBe(true)
    expect(text).toMatch(/^# Nikita Chernov\n\n> /)
    expect(text).toContain(`- [Resume](${baseURL}/en/resume.md)`)
    expect(text).toContain(`- [Content Test](${baseURL}/en/notes/content-test.md): A test note`)
    expect(text).toContain(`- [Заметки](${baseURL}/ru/notes.md)`)
    expect(text).toContain(`- [Full content](${baseURL}/llms-full.txt)`)
  })

  test('fetch llms-full.txt › should concatenate the English pages', async ({ request }) => {
    const response = await request.get('/llms-full.txt')
    const text = await response.text()

    expect(response.ok()).toBe(true)
    for (const heading of ['# Nikita Chernov\n', '# Resume – Nikita Chernov\n', '# Content Test\n', '# Bookshelf\n']) {
      expect(text).toContain(`\n---\n\n${heading}`)
    }
  })
})
