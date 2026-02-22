import type { Locale } from '@/app/i18n'

export const getRssUrl = (siteOrigin: string, locale: Locale) => {
  return `${siteOrigin}/${locale}/feed.xml`
}
