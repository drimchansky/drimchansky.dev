import type { CollectionEntry } from 'astro:content'

import { describe, expect, it } from 'vitest'

import { cleanNoteBody, renderNoteMarkdown } from './renderNoteMarkdown'

const note = (overrides: Partial<CollectionEntry<'notes'>['data']> = {}, body = 'Body.') => ({
  body,
  data: { publishingDate: new Date('2025-07-02T00:00:00.000Z'), title: 'A note', ...overrides },
  filePath: 'src/content/notes/en/a-note.mdx',
  id: 'en/a-note'
})

const resolveAsset = (projectPath: string) =>
  projectPath === '/src/components/notes/assets/meme.jpg' ? '/_astro/meme.abc123.jpg' : undefined

describe('cleanNoteBody', () => {
  it('strips heading id markers outside code fences only', () => {
    const body = ['## Title [#title]', '', '```sh', '# comment [#kept]', '```', '', '### Sub [#sub]'].join('\n')

    expect(cleanNoteBody(body, path => path)).toBe(
      ['## Title', '', '```sh', '# comment [#kept]', '```', '', '### Sub'].join('\n')
    )
  })

  it('rewrites relative link and image destinations through the resolver', () => {
    const body = '![Alt](../../../assets/a.jpg "Title") and [doc](./b.md) but not [abs](/c) or [ext](https://x.y/z)'

    expect(cleanNoteBody(body, path => `R(${path})`)).toBe(
      '![Alt](R(../../../assets/a.jpg) "Title") and [doc](R(./b.md)) but not [abs](/c) or [ext](https://x.y/z)'
    )
  })

  it('keeps shorter matching delimiters and relative links inside a longer fence', () => {
    const body = [
      '````md',
      '[inside](./inside.md)',
      '```',
      '## Fenced [#kept]',
      '````',
      '## Outside [#removed]',
      '[outside](./outside.md)'
    ].join('\n')

    expect(cleanNoteBody(body, path => `R(${path})`)).toBe(
      [
        '````md',
        '[inside](./inside.md)',
        '```',
        '## Fenced [#kept]',
        '````',
        '## Outside',
        '[outside](R(./outside.md))'
      ].join('\n')
    )
  })

  it('requires a closing fence to use the opening character', () => {
    const body = ['```md', '~~~', '## Fenced [#kept]', '```', '## Outside [#removed]'].join('\n')

    expect(cleanNoteBody(body, path => path)).toBe(
      ['```md', '~~~', '## Fenced [#kept]', '```', '## Outside'].join('\n')
    )
  })

  it('does not close a fence when the delimiter has a suffix', () => {
    const body = ['```md', '```not-a-close', '## Fenced [#kept]', '```', '## Outside [#removed]'].join('\n')

    expect(cleanNoteBody(body, path => path)).toBe(
      ['```md', '```not-a-close', '## Fenced [#kept]', '```', '## Outside'].join('\n')
    )
  })

  it('allows a longer matching delimiter to close a fence', () => {
    const body = ['```md', 'code', '````', '## Outside [#removed]', '[outside](./outside.md)'].join('\n')

    expect(cleanNoteBody(body, path => `R(${path})`)).toBe(
      ['```md', 'code', '````', '## Outside', '[outside](R(./outside.md))'].join('\n')
    )
  })
})

describe('renderNoteMarkdown', () => {
  it('renders the title, metadata and body', () => {
    expect(renderNoteMarkdown({ locale: 'en', note: note(), resolveAsset, siteOrigin: 'https://example.com' })).toBe(
      [
        '# A note',
        '',
        '- Published: 2025-07-02',
        '- Language: en',
        '- Canonical: https://example.com/en/notes/a-note/',
        '',
        'Body.'
      ].join('\n')
    )
  })

  it('adds the description, update date and the untranslated notice', () => {
    const result = renderNoteMarkdown({
      locale: 'en',
      note: note({
        description: 'What it is about.',
        isUntranslated: true,
        lastModified: new Date('2025-08-01T00:00:00.000Z')
      }),
      resolveAsset,
      siteOrigin: 'https://example.com'
    })

    expect(result).toContain(
      '# A note\n\n> What it is about.\n\n- Published: 2025-07-02\n- Updated: 2025-08-01\n- Language: ru\n'
    )
    expect(result).toContain('> This note is available only in Russian or translated partially')
  })

  it('resolves note assets against the site origin and leaves unknown paths untouched', () => {
    const body =
      '![Meme](../../../components/notes/assets/meme.jpg)\n\n![Missing](../../../components/notes/assets/none.jpg)'

    const result = renderNoteMarkdown({
      locale: 'en',
      note: note({}, body),
      resolveAsset,
      siteOrigin: 'https://example.com'
    })

    expect(result).toContain('![Meme](https://example.com/_astro/meme.abc123.jpg)')
    expect(result).toContain('![Missing](../../../components/notes/assets/none.jpg)')
  })
})
