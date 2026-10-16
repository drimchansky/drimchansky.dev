import { describe, expect, it } from 'vitest'

import { bookPageEstimateSchema, pageEstimateSchema } from './pageEstimateSchema.ts'

const method = {
  en: 'Reported word count ÷ 300, rounded to 10 pages.',
  ru: 'Число слов ÷ 300, округление до 10 страниц.'
}

describe('page estimate metadata', () => {
  it('keeps unknown length absent', () => {
    expect(bookPageEstimateSchema.parse({ language: 'ru' })).toEqual({ language: 'ru' })
  })

  it.each([1, 3, 10, 430, Number.MAX_SAFE_INTEGER])('accepts positive safe whole-page values: %s', pageEstimate => {
    expect(bookPageEstimateSchema.parse({ language: 'en', pageEstimate, pageEstimateMethod: method })).toEqual({
      language: 'en',
      pageEstimate,
      pageEstimateMethod: method
    })
  })

  it.each([0, -1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '430', null, {}])(
    'rejects invalid page values: %s',
    value => {
      expect(pageEstimateSchema.safeParse(value).success).toBe(false)
    }
  )

  it('requires the number and bilingual hint together', () => {
    expect(bookPageEstimateSchema.safeParse({ language: 'en', pageEstimate: 430 }).success).toBe(false)
    expect(bookPageEstimateSchema.safeParse({ language: 'en', pageEstimateMethod: method }).success).toBe(false)
  })

  it.each([{}, { en: 'English only' }, { ru: 'Только русский' }, { ...method, en: ' \n ' }, { ...method, ru: '' }])(
    'rejects missing or blank localized hints: %s',
    pageEstimateMethod => {
      expect(bookPageEstimateSchema.safeParse({ language: 'ru', pageEstimate: 430, pageEstimateMethod }).success).toBe(
        false
      )
    }
  )

  it('trims localized hints without imposing a length limit', () => {
    const pageEstimateMethod = { en: `  ${method.en}  `, ru: `\n${method.ru.repeat(30)}\n` }
    expect(
      bookPageEstimateSchema.parse({ language: 'ru', pageEstimate: 430, pageEstimateMethod }).pageEstimateMethod
    ).toEqual({
      en: method.en,
      ru: method.ru.repeat(30)
    })
  })
})
