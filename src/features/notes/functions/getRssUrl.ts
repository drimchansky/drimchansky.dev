import type { Locale } from '@/shared/i18n'

import { BASE_URL } from '@/shared/constants'

export const getRssUrl = (locale: Locale) => {
  return `${BASE_URL}/${locale}/feed.xml`
}
