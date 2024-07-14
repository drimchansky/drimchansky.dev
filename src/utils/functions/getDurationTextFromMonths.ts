import { addMonths, differenceInMonths, differenceInYears } from 'date-fns'

import type { Locale } from '@/i18n'

import { getMonthsText } from './getMonthsText'
import { getYearsText } from './getYearsText'

export const getDurationTextFromMonths = (numMonths: number, locale: Locale) => {
  let result = ''

  const date = new Date(0)
  const futureDate = addMonths(date, numMonths)

  const years = differenceInYears(futureDate, date)
  const months = differenceInMonths(futureDate, addMonths(date, years * 12))

  years && (result += `${years} ${getYearsText(years, locale)}`)
  years && months && (locale === 'en' ? (result += ' ') : (result += ' и '))
  months && (result += `${months} ${getMonthsText(months, locale)}`)

  return result
}
