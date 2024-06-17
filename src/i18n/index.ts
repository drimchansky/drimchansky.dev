import { en } from './locales/en'
import { ru } from './locales/ru'

export type Locale = 'en' | 'ru'

export type LocaleCollection = {
  404: string
  additionalInfo: string
  auto: string
  dark: string
  download: string
  familyName: string
  fullName: string
  givenName: string
  homePage: string
  intro: string
  light: string
  location: string
  menu: string
  occupation: string
  present: string
  resume: string
  siteDescription: string
  skipLink: string
  summary: string
  theme: string
  toLocale: string
  workingExperience: string
}

export type TokenName = keyof LocaleCollection

const locales: { [key in Locale]: LocaleCollection } = {
  en,
  ru
}

export const getLocale = (rawLocale: string | undefined): Locale => {
  return (rawLocale || 'en') as Locale
}

export const t = (rawLocale: string | undefined, token: TokenName) => {
  return locales[getLocale(rawLocale)][token]
}

const getYearsText = (locale: Locale, numYears: number): string => {
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

const getMonthsText = (locale: Locale, numMonths: number): string => {
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

export const formatYearsAndMonths = (locale: Locale, years?: number, months?: number) => {
  let result = ''

  years && (result += `${years} ${getYearsText(locale, years)}`)
  years && months && (result += ' ')
  months && (result += `${months} ${getMonthsText(locale, months)}`)

  return result
}
