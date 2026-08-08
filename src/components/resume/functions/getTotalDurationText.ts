import type { Locale } from '@/app/i18n'

import { getDurationTextFromMonths } from './getDurationTextFromMonths'

const utcMonthIndex = (date: Date) => date.getUTCFullYear() * 12 + date.getUTCMonth()
const localMonthIndex = (date: Date) => date.getFullYear() * 12 + date.getMonth()

/**
 * LinkedIn-like calculation style logic
 */
export const getTotalDurationText = (dateStart: Date, dateEnd: Date | undefined, locale: Locale) => {
  const endMonthIndex = dateEnd ? utcMonthIndex(dateEnd) : localMonthIndex(new Date())
  const totalMonths = endMonthIndex - utcMonthIndex(dateStart) + 1

  return getDurationTextFromMonths(totalMonths, locale)
}
