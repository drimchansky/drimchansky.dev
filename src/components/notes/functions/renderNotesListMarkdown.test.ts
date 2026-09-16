import type { CollectionEntry } from 'astro:content'

import { describe, expect, it } from 'vitest'

import { supportedLocales, t } from '@/app/i18n'

import { renderNotesListMarkdown } from './renderNotesListMarkdown'

const note = (id: string, date: string, description?: string): CollectionEntry<'notes'> => ({
  body: 'Body.',
  collection: 'notes',
  data: { description, publishingDate: new Date(date), title: id },
  id
})

describe('renderNotesListMarkdown', () => {
  it.each(supportedLocales)('groups %s notes by UTC year, newest first, with Markdown links', locale => {
    const result = renderNotesListMarkdown(locale, 'https://example.com', [
      note(`${locale}/old`, '2023-01-01T00:00:00Z'),
      note(`${locale}/middle`, '2024-06-01T00:00:00Z'),
      note(`${locale}/new`, '2024-12-31T23:30:00Z', 'Summary.')
    ])
    expect(result).toBe(
      [
        `# ${t(locale, 'notes')}`,
        '',
        `- Canonical: https://example.com/${locale}/notes/`,
        `- RSS: https://example.com/${locale}/feed.xml`,
        '',
        '## 2024',
        '',
        `- [${locale}/new](https://example.com/${locale}/notes/new.md) — 2024-12-31`,
        '  Summary.',
        `- [${locale}/middle](https://example.com/${locale}/notes/middle.md) — 2024-06-01`,
        '',
        '## 2023',
        '',
        `- [${locale}/old](https://example.com/${locale}/notes/old.md) — 2023-01-01`
      ].join('\n')
    )
  })

  it('keeps discovery metadata for an empty list', () => {
    expect(renderNotesListMarkdown('en', 'https://example.com', [])).toBe(
      '# Notes\n\n- Canonical: https://example.com/en/notes/\n- RSS: https://example.com/en/feed.xml'
    )
  })
})
