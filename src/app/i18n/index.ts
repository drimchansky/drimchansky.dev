import { en } from './locales/en'
import { ru } from './locales/ru'

export type Locale = 'en' | 'ru'

export type LocaleCollection = {
  404: string
  all: string
  auto: string
  backToNotes: string
  bookshelf: string
  currentlyReading: string
  dark: string
  download: string
  education: string
  familyName: string
  fiction: string
  fullName: string
  givenName: string
  home: string
  hybrid: string
  intro: string
  langEn: string
  langRu: string
  lastUpdated: string
  light: string
  location: string
  menu: string
  nonFiction: string
  notes: string
  occupation: string
  'on-site': string
  present: string
  remote: string
  resume: string
  siteDescription: string
  skillsAndLanguages: string
  skipLink: string
  skipped: string
  summary: string
  theme: string
  toLocale: string
  untranslated: string
  workingExperience: string
}

export type TokenName = keyof LocaleCollection

const locales: { [key in Locale]: LocaleCollection } = {
  en,
  ru
}

export const supportedLocales = Object.keys(locales) as Locale[]

export const getLocale = (rawLocale: string | undefined): Locale => {
  return supportedLocales.includes(rawLocale as Locale) ? (rawLocale as Locale) : 'en'
}

export const t = (rawLocale: string | undefined, token: TokenName) => {
  return locales[getLocale(rawLocale)][token]
}
