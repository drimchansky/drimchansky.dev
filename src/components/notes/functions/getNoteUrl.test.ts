import { describe, expect, it } from 'vitest'

import { getNoteUrl } from './getNoteUrl'

describe('getNoteUrl', () => {
  it('builds an English note URL with a locale prefix and a trailing slash', () => {
    expect(getNoteUrl('en', 'en/foo')).toBe('/en/notes/foo/')
  })

  it('builds a Russian note URL with a locale prefix and a trailing slash', () => {
    expect(getNoteUrl('ru', 'ru/foo')).toBe('/ru/notes/foo/')
  })

  it('keeps a nested slug in the URL path', () => {
    expect(getNoteUrl('en', 'en/a/b')).toBe('/en/notes/a/b/')
  })
})
