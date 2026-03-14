import { describe, expect, it } from 'vitest'

import { getYearsText } from './getYearsText'

describe('getYearsText', () => {
  describe('English', () => {
    it('returns "year" for 1', () => {
      expect(getYearsText(1, 'en')).toBe('year')
    })

    it('returns "years" for plural values', () => {
      expect(getYearsText(2, 'en')).toBe('years')
      expect(getYearsText(5, 'en')).toBe('years')
      expect(getYearsText(10, 'en')).toBe('years')
    })
  })

  describe('Russian', () => {
    it('returns "год" for 1', () => {
      expect(getYearsText(1, 'ru')).toBe('год')
    })

    it('returns "года" for 2-4', () => {
      expect(getYearsText(2, 'ru')).toBe('года')
      expect(getYearsText(3, 'ru')).toBe('года')
      expect(getYearsText(4, 'ru')).toBe('года')
    })

    it('returns "лет" for 5+', () => {
      expect(getYearsText(5, 'ru')).toBe('лет')
      expect(getYearsText(10, 'ru')).toBe('лет')
    })
  })
})
