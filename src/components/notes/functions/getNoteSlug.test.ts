import { describe, expect, it } from 'vitest'

import { getNoteSlug } from './getNoteSlug'

describe('getNoteSlug', () => {
  it('drops the locale segment from a flat id', () => {
    expect(getNoteSlug('en/foo')).toBe('foo')
    expect(getNoteSlug('ru/foo')).toBe('foo')
  })

  it('keeps the nested path below the locale segment', () => {
    expect(getNoteSlug('en/a/b')).toBe('a/b')
    expect(getNoteSlug('ru/a/b/c')).toBe('a/b/c')
  })
})
