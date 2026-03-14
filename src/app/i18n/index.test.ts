import { describe, expect, it } from 'vitest'

import { getLocale, t } from '.'
import { en } from './locales/en'
import { ru } from './locales/ru'

describe('getLocale', () => {
  it('returns "en" for undefined', () => {
    expect(getLocale(undefined)).toBe('en')
  })

  it('returns "en" for empty string', () => {
    expect(getLocale('')).toBe('en')
  })

  it('returns "en" for valid "en" input', () => {
    expect(getLocale('en')).toBe('en')
  })

  it('returns "ru" for valid "ru" input', () => {
    expect(getLocale('ru')).toBe('ru')
  })

  it('falls back to "en" for unsupported locale', () => {
    expect(getLocale('fr')).toBe('en')
    expect(getLocale('de')).toBe('en')
    expect(getLocale('invalid')).toBe('en')
  })
})

describe('t', () => {
  it('returns English token value', () => {
    expect(t('en', 'home')).toBe(en.home)
  })

  it('returns Russian token value', () => {
    expect(t('ru', 'home')).toBe(ru.home)
  })

  it('falls back to English for undefined locale', () => {
    expect(t(undefined, 'home')).toBe(en.home)
  })

  it('falls back to English for invalid locale', () => {
    expect(t('fr', 'home')).toBe(en.home)
  })
})
