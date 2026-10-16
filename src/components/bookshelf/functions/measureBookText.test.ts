import { describe, expect, it } from 'vitest'

import { measureBookText } from './measureBookText.ts'

describe('plain book text measurements', () => {
  it('counts English and Russian text without punctuation as words', () => {
    expect(measureBookText('Hello,\n мир!')).toEqual({
      charactersWithNormalizedSpaces: 11,
      charactersWithoutWhitespace: 10,
      words: 2
    })
  })

  it('normalizes NFC, line endings and Unicode whitespace before measuring code points', () => {
    expect(measureBookText(' \tCafe\u0301\u00a0е\u0308ж\r\n  ')).toEqual({
      charactersWithNormalizedSpaces: 7,
      charactersWithoutWhitespace: 6,
      words: 2
    })
  })

  it('includes Unicode letters and number tokens', () => {
    expect(measureBookText('élève 東京 ٣ café')).toEqual({
      charactersWithNormalizedSpaces: 15,
      charactersWithoutWhitespace: 12,
      words: 4
    })
    expect(measureBookText('42 3.14 2026').words).toBe(4)
  })

  it('retains internal apostrophes and the supported hyphens in one token', () => {
    expect(measureBookText("don't O’Reilly рок-н-ролл по‐русски кто‑то").words).toBe(5)
    expect(measureBookText('— Привет — мир -- hello – world').words).toBe(4)
  })

  it('measures supplementary characters as code points without inventing words', () => {
    expect(measureBookText('👍🏽')).toEqual({
      charactersWithNormalizedSpaces: 2,
      charactersWithoutWhitespace: 2,
      words: 0
    })
  })

  it.each(['', ' \t\r\n\u00a0', '\u202f\u2028'])('returns zero measurements for empty normalized text', text => {
    expect(measureBookText(text)).toEqual({
      charactersWithNormalizedSpaces: 0,
      charactersWithoutWhitespace: 0,
      words: 0
    })
  })

  it('does not leak a regular expression cursor between calls', () => {
    expect(measureBookText('one two').words).toBe(2)
    expect(measureBookText('три').words).toBe(1)
    expect(measureBookText('one two').words).toBe(2)
  })
})
