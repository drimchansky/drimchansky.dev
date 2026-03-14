import { describe, expect, it } from 'vitest'

import { getDurationTextFromMonths } from './getDurationTextFromMonths'

describe('getDurationTextFromMonths', () => {
  it('returns empty string for 0 months', () => {
    expect(getDurationTextFromMonths(0, 'en')).toBe('')
  })

  it('returns months only when less than 12', () => {
    expect(getDurationTextFromMonths(1, 'en')).toBe('1 month')
    expect(getDurationTextFromMonths(6, 'en')).toBe('6 months')
    expect(getDurationTextFromMonths(11, 'en')).toBe('11 months')
  })

  it('returns years only when exact multiple of 12', () => {
    expect(getDurationTextFromMonths(12, 'en')).toBe('1 year')
    expect(getDurationTextFromMonths(24, 'en')).toBe('2 years')
  })

  it('returns years and months combined', () => {
    expect(getDurationTextFromMonths(13, 'en')).toBe('1 year 1 month')
    expect(getDurationTextFromMonths(14, 'en')).toBe('1 year 2 months')
    expect(getDurationTextFromMonths(25, 'en')).toBe('2 years 1 month')
  })

  it('uses Russian conjunction "и" between years and months', () => {
    expect(getDurationTextFromMonths(13, 'ru')).toBe('1 год и 1 месяц')
    expect(getDurationTextFromMonths(25, 'ru')).toBe('2 года и 1 месяц')
    expect(getDurationTextFromMonths(27, 'ru')).toBe('2 года и 3 месяца')
  })

  it('handles Russian months-only correctly', () => {
    expect(getDurationTextFromMonths(1, 'ru')).toBe('1 месяц')
    expect(getDurationTextFromMonths(5, 'ru')).toBe('5 месяцев')
  })

  it('handles Russian years-only correctly', () => {
    expect(getDurationTextFromMonths(12, 'ru')).toBe('1 год')
    expect(getDurationTextFromMonths(24, 'ru')).toBe('2 года')
    expect(getDurationTextFromMonths(60, 'ru')).toBe('5 лет')
  })
})
