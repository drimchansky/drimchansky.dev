import type { Locale } from '../../../app/i18n/index.ts'

import { t } from '../../../app/i18n/index.ts'

export const formatPageEstimate = (pages: number | undefined, method: string | undefined, locale: Locale) => {
  if (pages === undefined || method === undefined) return undefined

  return {
    explanation: method,
    label:
      pages < 10
        ? t(locale, 'pageEstimateShort')
        : t(locale, 'pageEstimateLabel').replace('{pages}', new Intl.NumberFormat(locale).format(pages))
  }
}
