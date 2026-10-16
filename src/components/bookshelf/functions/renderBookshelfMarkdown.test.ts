import type { CollectionEntry } from 'astro:content'

import MarkdownIt from 'markdown-it'
import { describe, expect, it } from 'vitest'

import { renderBookshelfMarkdown } from './renderBookshelfMarkdown'

type BookData = CollectionEntry<'books'>['data']
const method = { en: 'Full-text count at 300 words/page.', ru: 'Подсчёт полного текста при 300 слов/стр.' }

const book = (overrides: Partial<BookData>) =>
  ({
    data: {
      author: { en: 'Author', ru: 'Автор' },
      cover: 'x.jpg',
      dateFinished: '2024-06-01',
      language: 'en',
      rating: 4.5,
      title: { en: 'Title', ru: 'Название' },
      type: 'fiction',
      ...overrides
    }
  }) as CollectionEntry<'books'>

describe('renderBookshelfMarkdown', () => {
  it('groups read books by year after the currently-reading ones and formats ratings per locale', () => {
    const books = [
      book({ dateFinished: null, rating: null, title: { en: 'Reading', ru: 'Читаю' } }),
      book({ dateFinished: '2023-02-01', title: { en: 'Older', ru: 'Старее' }, type: 'non-fiction' }),
      book({ dateFinished: '2024-06-01', rating: 3, skipped: true, title: { en: 'Dropped', ru: 'Брошена' } }),
      book({ dateFinished: '2024-08-01', language: 'ru' })
    ]

    expect(renderBookshelfMarkdown('en', 'https://example.com', books)).toBe(
      [
        '# Bookshelf',
        '',
        '- Canonical: https://example.com/en/bookshelf/',
        '- All: 3 · Fiction: 2 · Non-fiction: 1',
        '',
        '## Currently reading',
        '',
        '- **Reading** — Author · English',
        '',
        '## 2024',
        '',
        '- **Title** — Author · 4.5 out of 5 · Russian',
        '- **Dropped** — Author · Did not finish · English',
        '',
        '## 2023',
        '',
        '- **Older** — Author · 4.5 out of 5 · English'
      ].join('\n')
    )
  })

  it('uses the localized title, author and labels and indents a description under its item', () => {
    const books = [book({ description: { en: 'Two\n\nparagraphs', ru: 'Два\n\nабзаца' } })]

    expect(renderBookshelfMarkdown('ru', 'https://example.com', books)).toBe(
      [
        '# Книжная полка',
        '',
        '- Canonical: https://example.com/ru/bookshelf/',
        '- Все: 1 · Художественная: 1 · Нон-фикшн: 0',
        '',
        '## 2024',
        '',
        '- **Название** — Автор · 4,5 из 5 · Английский',
        '',
        '  Два',
        '',
        '  абзаца'
      ].join('\n')
    )
  })

  for (const locale of ['en', 'ru'] as const) {
    it(`exports stored numbers and the selected localized hints in ${locale}`, () => {
      const hints = [
        {
          en: 'Reported word count ÷ 300, rounded to 10 pages.',
          ru: 'Заявленное число слов ÷ 300, округление до 10 страниц.'
        },
        method,
        {
          en: 'Opening sample; assumes no-space totals.',
          ru: 'По началу книги; символы предположительно без пробелов.'
        }
      ]
      const text = renderBookshelfMarkdown(
        locale,
        'https://example.com',
        hints.map(pageEstimateMethod =>
          book({
            pageEstimate: 430,
            pageEstimateMethod
          })
        )
      )
      expect(text.match(locale === 'en' ? /≈430 pages/g : /≈430 стр\./g)).toHaveLength(3)
      for (const hint of hints) expect(text).toContain(`  ${hint[locale]}`)
      for (const hint of hints) expect(text).not.toContain(hint[locale === 'en' ? 'ru' : 'en'])
    })

    it(`preserves current/unfinished status and descriptions alongside combined-work hints in ${locale}`, () => {
      const pageEstimateMethod = {
        en: '2 distinct works, summed before rounding at 300 words/page.',
        ru: '2 отдельных произведения: сумма до округления при 300 слов/стр.'
      }
      const text = renderBookshelfMarkdown(locale, 'https://example.com', [
        book({
          dateFinished: null,
          description: { en: 'Current **description**', ru: 'Текущее **описание**' },
          pageEstimate: 10,
          pageEstimateMethod,
          rating: null
        }),
        book({ pageEstimate: 10, pageEstimateMethod, skipped: true })
      ])
      expect(text.match(locale === 'en' ? /≈10 pages/g : /≈10 стр\./g)).toHaveLength(2)
      expect(text).toContain(locale === 'en' ? '## Currently reading' : '## Сейчас читаю')
      expect(text).toContain(locale === 'en' ? 'Did not finish' : 'Не дочитал')
      expect(text).toContain(locale === 'en' ? '  Current **description**' : '  Текущее **описание**')
      expect(text).toContain(pageEstimateMethod[locale])
      expect(text).toContain(locale === 'en' ? '- All: 1' : '- Все: 1')
    })
  }

  it('omits unknown lengths and escapes short labels and hint text without creating links', () => {
    const text = renderBookshelfMarkdown('en', 'https://example.com', [
      book({}),
      book({
        pageEstimate: 3,
        pageEstimateMethod: { en: 'A *note* <tag> &amp;\n[next](https://invalid.example)', ru: 'Тест' }
      })
    ])
    expect(text.match(/\\<10 pages/g)).toHaveLength(1)
    expect(text).not.toContain('\n[next]')
    const html = new MarkdownIt({ html: true }).render(text)
    expect(html).not.toContain('<a ')
    expect(html).toContain('&lt;10 pages')
    expect(html).toContain('A *note* &lt;tag&gt; &amp;amp; [next](https://invalid.example)')
    expect(html).not.toContain('<tag>')
  })
})
