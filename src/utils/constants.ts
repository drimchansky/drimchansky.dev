export const THEME_STORAGE_KEY = 'color-theme'

export enum ColorTheme {
  AUTO = 'auto',
  DARK = 'dark',
  LIGHT = 'light'
}

export const THEME_CLASSES = {
  [ColorTheme.DARK]: 'is-dark-theme',
  [ColorTheme.LIGHT]: 'is-light-theme'
}

export const CUSTOM_IMAGE_ROUTES = ['resume']
