import type { Locale } from '@/shared/i18n'

export const THEME_STORAGE_KEY = 'color-theme'

export const colorThemeValues = ['light', 'auto', 'dark'] as const
export type ColorTheme = (typeof colorThemeValues)[number]

export const THEME_CLASSES: Partial<Record<ColorTheme, string>> = {
  dark: 'is-dark-theme',
  light: 'is-light-theme'
}

export const CUSTOM_COVER_ROUTES = ['resume', 'notes']

export const RESUME_FILENAMES_BY_LOCALE: Record<Locale, string> = {
  en: 'Nikita_Chernov_Frontend_Resume',
  ru: 'Никита_Чернов_Фронтенд_Резюме'
}

export const BASE_URL = process.env.SITE_URL
