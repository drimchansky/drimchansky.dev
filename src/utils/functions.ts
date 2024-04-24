import type { Locale } from './types'

export const getLocale = (raw: string | undefined): Locale => {
  return (raw || 'en') as Locale
}
