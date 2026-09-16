import type { CollectionEntry } from 'astro:content'

import { describe, expect, it } from 'vitest'

import { renderBookshelfMarkdown } from './renderBookshelfMarkdown'

type BookData = CollectionEntry<'books'>['data']

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
})
