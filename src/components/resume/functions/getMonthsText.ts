import type { Locale } from '@/app/i18n'

import { pluralize } from './pluralize'

const forms: Record<Locale, Partial<Record<Intl.LDMLPluralRule, string>>> = {
  en: { one: 'month', other: 'months' },
  ru: { few: 'месяца', many: 'месяцев', one: 'месяц' }
}

export const getMonthsText = (numMonths: number, locale: Locale): string => {
  return pluralize(numMonths, locale, forms[locale])
}
