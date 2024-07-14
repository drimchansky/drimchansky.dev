import type { Locale } from '@/i18n'

export const getMonthsText = (numMonths: number, locale: Locale): string => {
  switch (true) {
    case locale === 'en' && numMonths === 1:
      return 'month'

    case locale === 'en':
      return 'months'

    case locale === 'ru' && numMonths === 1:
      return 'месяц'

    case locale === 'ru' && numMonths <= 4:
      return 'месяца'

    default:
      return 'месяцев'
  }
}
