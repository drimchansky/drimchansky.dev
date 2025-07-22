import type { Locale } from '@/shared/i18n'

export const getRssUrl = (locale: Locale) => {
  return `${process.env.SITE_URL}/${locale}/feed.xml`
}
