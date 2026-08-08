import { describe, expect, it } from 'vitest'

import { getTotalDurationText } from './getTotalDurationText'

// Content-collection dates are authored as unquoted `YYYY-MM-DD`, which YAML parses
// to UTC midnight — so the month must be read in UTC or a negative-offset build
// counts from the previous month.
const collectionDate = (value: string) => new Date(`${value}T00:00:00.000Z`)

describe('getTotalDurationText', () => {
  it('counts a closed range inclusively', () => {
    expect(getTotalDurationText(collectionDate('2019-03-01'), collectionDate('2020-11-01'), 'en')).toBe(
      '1 year 9 months'
    )
  })

  it('counts from a first-of-month start date', () => {
    expect(getTotalDurationText(collectionDate('2020-12-01'), collectionDate('2025-08-08'), 'en')).toBe(
      '4 years 9 months'
    )
  })

  it('counts a range within a single month', () => {
    expect(getTotalDurationText(collectionDate('2025-08-11'), collectionDate('2025-12-04'), 'en')).toBe('5 months')
  })

  it('counts an open-ended range up to the current month', () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 15)

    expect(getTotalDurationText(start, undefined, 'en')).toBe('3 months')
  })
})
