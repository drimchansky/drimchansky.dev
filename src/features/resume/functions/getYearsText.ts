import type { Locale } from '@/shared/i18n'

export const getYearsText = (numYears: number, locale: Locale): string => {
  switch (true) {
    case locale === 'en' && numYears === 1:
      return 'year'

    case locale === 'en':
      return 'years'

    case locale === 'ru' && numYears === 1:
      return 'год'

    case locale === 'ru' && numYears <= 4:
      return 'года'

    default:
      return 'лет'
  }
}
