import { en } from './locales/en'
import { ru } from './locales/ru'

export type Locale = 'en' | 'ru'

export type LocaleCollection = {
  404: string
  auto: string
  dark: string
  download: string
  education: string
  experienceLine: string
  familyName: string
  fullName: string
  givenName: string
  homePage: string
  hybrid: string
  intro: string
  light: string
  location: string
  menu: string
  occupation: string
  'on-site': string
  present: string
  remote: string
  resume: string
  siteDescription: string
  skillsAndLanguages: string
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
