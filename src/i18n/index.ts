import { en } from './locales/en'
import { ru } from './locales/ru'

export type Locale = 'en' | 'ru'

export type LocaleCollection = {
  404: string
  auto: string
  dark: string
  homePage: string
  light: string
  name: string
  resume: string
  siteDescription: string
  theme: string
  toLocale: string
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
