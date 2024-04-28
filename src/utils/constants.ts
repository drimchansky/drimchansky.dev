export const THEME_STORAGE_KEY = 'color-theme'

export enum ColorTheme {
  LIGHT = 'light',
  AUTO = 'auto',
  DARK = 'dark'
}

export const THEME_CLASSES = {
  [ColorTheme.DARK]: 'is-dark-theme',
  [ColorTheme.LIGHT]: 'is-light-theme'
}
