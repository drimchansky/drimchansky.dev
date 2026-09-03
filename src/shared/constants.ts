export const CUSTOM_COVER_ROUTES = ['resume', 'notes']

export const THEME_STORAGE_KEY = 'color-theme'

export const colorThemeValues = ['light', 'auto', 'dark'] as const
export type ColorTheme = (typeof colorThemeValues)[number]

export const THEME_CLASSES: Record<'dark' | 'light', string> = {
  dark: 'is-dark-theme',
  light: 'is-light-theme'
}
