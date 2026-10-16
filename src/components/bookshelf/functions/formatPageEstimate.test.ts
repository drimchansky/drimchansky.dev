import { describe, expect, it } from 'vitest'

import { formatPageEstimate } from './formatPageEstimate.ts'

describe('localized page estimates', () => {
  it.each(['en', 'ru'] as const)('omits an estimate missing either paired value in %s', locale => {
    expect(formatPageEstimate(undefined, undefined, locale)).toBeUndefined()
    expect(formatPageEstimate(430, undefined, locale)).toBeUndefined()
    expect(formatPageEstimate(undefined, 'Hint', locale)).toBeUndefined()
  })

  it.each(['en', 'ru'] as const)('uses the stored number and selected localized hint in %s', locale => {
    const hint = locale === 'en' ? 'Reported count, rounded.' : 'Заявленное число слов с округлением.'
    expect(formatPageEstimate(430, hint, locale)).toEqual({
      explanation: hint,
      label: locale === 'en' ? '≈430 pages' : '≈430 стр.'
    })
  })

  it.each([1, 3, 9])('labels short works without displaying a rounded zero: %s', pages => {
    expect(formatPageEstimate(pages, 'Short work', 'en')?.label).toBe('<10 pages')
    expect(formatPageEstimate(pages, 'Короткое произведение', 'ru')?.label).toBe('<10 стр.')
  })

  it('formats ten pages and larger stored values without recalculating them', () => {
    expect(formatPageEstimate(10, 'Hint', 'en')?.label).toBe('≈10 pages')
    expect(formatPageEstimate(1030, 'Hint', 'en')?.label).toBe('≈1,030 pages')
    expect(formatPageEstimate(1030, 'Пояснение', 'ru')?.label).toBe('≈1 030 стр.')
    expect(formatPageEstimate(431, 'Hint', 'en')?.label).toBe('≈431 pages')
  })
})
