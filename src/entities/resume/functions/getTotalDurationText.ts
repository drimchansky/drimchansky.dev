import type { Locale } from '@/shared/i18n'

import { getDurationTextFromMonths } from './getDurationTextFromMonths'

/**
 * LinkedIn-like calculation style logic
 */
export const getTotalDurationText = (dateStart: Date, dateEnd: Date | undefined, locale: Locale) => {
  const endDate = dateEnd || new Date()
  const totalMonths =
    endDate.getFullYear() * 12 + endDate.getMonth() - dateStart.getFullYear() * 12 - dateStart.getMonth() + 1

  return getDurationTextFromMonths(totalMonths, locale)
}
