import type { Locale } from '@/app/i18n'

import { pluralize } from './pluralize'

const forms: Record<Locale, Partial<Record<Intl.LDMLPluralRule, string>>> = {
  en: { one: 'year', other: 'years' },
  ru: { few: 'года', many: 'лет', one: 'год' }
}

export const getYearsText = (numYears: number, locale: Locale): string => {
  return pluralize(numYears, locale, forms[locale])
}
