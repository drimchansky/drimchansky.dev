import { describe, expect, it } from 'vitest'

import { getMonthsText } from './getMonthsText'

describe('getMonthsText', () => {
  describe('English', () => {
    it('returns "month" for 1', () => {
      expect(getMonthsText(1, 'en')).toBe('month')
    })

    it('returns "months" for plural values', () => {
      expect(getMonthsText(2, 'en')).toBe('months')
      expect(getMonthsText(5, 'en')).toBe('months')
      expect(getMonthsText(11, 'en')).toBe('months')
    })
  })

  describe('Russian', () => {
    it('returns "месяц" for 1', () => {
      expect(getMonthsText(1, 'ru')).toBe('месяц')
    })

    it('returns "месяца" for 2-4', () => {
      expect(getMonthsText(2, 'ru')).toBe('месяца')
      expect(getMonthsText(3, 'ru')).toBe('месяца')
      expect(getMonthsText(4, 'ru')).toBe('месяца')
    })

    it('returns "месяцев" for 5+', () => {
      expect(getMonthsText(5, 'ru')).toBe('месяцев')
    })

    it('returns "месяцев" for 11-14 (special case)', () => {
      expect(getMonthsText(11, 'ru')).toBe('месяцев')
      expect(getMonthsText(12, 'ru')).toBe('месяцев')
      expect(getMonthsText(14, 'ru')).toBe('месяцев')
    })

    it('returns correct forms for 21, 22, 25', () => {
      expect(getMonthsText(21, 'ru')).toBe('месяц')
      expect(getMonthsText(22, 'ru')).toBe('месяца')
      expect(getMonthsText(25, 'ru')).toBe('месяцев')
    })

    it('returns correct forms for 111, 112, 121', () => {
      expect(getMonthsText(111, 'ru')).toBe('месяцев')
      expect(getMonthsText(112, 'ru')).toBe('месяцев')
      expect(getMonthsText(121, 'ru')).toBe('месяц')
    })
  })
})
