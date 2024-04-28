import { en } from './locales/en'
import { ru } from './locales/ru'

export type Locale = 'en' | 'ru'

export type LocaleCollection = {
  name: string
  siteDescription: string
  homePage: string
  resume: string
  theme: string
  light: string
  auto: string
  dark: string
  toLocale: string
  404: string
}

export type TokenName = keyof LocaleCollection

const locales: { [key in Locale]: LocaleCollection } = {
  ru,
  en
}

export const getLocale = (rawLocale: string | undefined): Locale => {
  return (rawLocale || 'en') as Locale
}

export const t = (rawLocale: string | undefined, token: TokenName) => {
  return locales[getLocale(rawLocale)][token]
}
