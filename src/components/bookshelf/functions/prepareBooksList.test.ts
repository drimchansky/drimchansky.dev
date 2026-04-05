import { describe, expect, it } from 'vitest'

import { prepareBooksList } from './prepareBooksList'

const mockBook = (data: Partial<{ dateFinished: string | null; fiction: boolean; skipped: boolean }>) =>
  ({ data: { dateFinished: '2024-06-01', fiction: true, ...data } }) as any

describe('prepareBooksList', () => {
  it('returns empty arrays for empty input', () => {
    const result = prepareBooksList([])
    expect(result).toEqual({
      counts: { all: 0, fiction: 0, nonFiction: 0 },
      currentlyReading: [],
      readByYear: []
    })
  })

  it('computes counts by fiction type', () => {
    const books = [
      mockBook({ dateFinished: '2024-01-01', fiction: true }),
      mockBook({ dateFinished: '2024-02-01', fiction: true }),
      mockBook({ dateFinished: '2024-03-01', fiction: false }),
      mockBook({ dateFinished: null, fiction: true })
    ]

    const { counts } = prepareBooksList(books)
    expect(counts).toEqual({ all: 4, fiction: 3, nonFiction: 1 })
  })

  it('filters currently-reading books', () => {
    const books = [
      mockBook({ dateFinished: null }),
      mockBook({ dateFinished: null }),
      mockBook({ dateFinished: '2024-06-01' })
    ]

    const { currentlyReading } = prepareBooksList(books)
    expect(currentlyReading).toHaveLength(2)
    expect(currentlyReading.every((b: any) => b.data.dateFinished === null)).toBe(true)
  })

  it('excludes currently-reading books from readByYear', () => {
    const books = [mockBook({ dateFinished: null }), mockBook({ dateFinished: '2024-06-01' })]

    const { readByYear } = prepareBooksList(books)
    expect(readByYear).toHaveLength(1)
    expect(readByYear[0][1]).toHaveLength(1)
    expect(readByYear[0][1][0].data.dateFinished).toBe('2024-06-01')
  })

  it('sorts years in descending order', () => {
    const books = [
      mockBook({ dateFinished: '2022-03-01' }),
      mockBook({ dateFinished: '2025-01-01' }),
      mockBook({ dateFinished: '2023-06-01' })
    ]

    const { readByYear } = prepareBooksList(books)
    expect(readByYear.map(([year]: [string, any]) => year)).toEqual(['2025', '2023', '2022'])
  })

  it('sorts books by date descending within the same year', () => {
    const books = [
      mockBook({ dateFinished: '2024-01-01' }),
      mockBook({ dateFinished: '2024-09-01' }),
      mockBook({ dateFinished: '2024-05-01' })
    ]

    const { readByYear } = prepareBooksList(books)
    expect(readByYear).toHaveLength(1)
    const dates = readByYear[0][1].map((b: any) => b.data.dateFinished)
    expect(dates).toEqual(['2024-09-01', '2024-05-01', '2024-01-01'])
  })

  it('groups books by year', () => {
    const books = [
      mockBook({ dateFinished: '2024-03-01' }),
      mockBook({ dateFinished: '2024-07-01' }),
      mockBook({ dateFinished: '2023-06-01' })
    ]

    const { readByYear } = prepareBooksList(books)
    expect(readByYear).toHaveLength(2)
    expect(readByYear[0]).toEqual(['2024', expect.any(Array)])
    expect(readByYear[0][1]).toHaveLength(2)
    expect(readByYear[1]).toEqual(['2023', expect.any(Array)])
    expect(readByYear[1][1]).toHaveLength(1)
  })

  it('excludes skipped books from counts', () => {
    const books = [
      mockBook({ fiction: true }),
      mockBook({ fiction: false, skipped: true }),
      mockBook({ fiction: true, skipped: true })
    ]

    const { counts } = prepareBooksList(books)
    expect(counts).toEqual({ all: 1, fiction: 1, nonFiction: 0 })
  })

  it('includes skipped books in readByYear', () => {
    const books = [mockBook({ dateFinished: '2024-01-01' }), mockBook({ dateFinished: '2024-06-01', skipped: true })]

    const { readByYear } = prepareBooksList(books)
    expect(readByYear[0][1]).toHaveLength(2)
  })

  it('handles mixed statuses correctly', () => {
    const books = [
      mockBook({ dateFinished: null }),
      mockBook({ dateFinished: '2025-01-01' }),
      mockBook({ dateFinished: '2024-06-01' }),
      mockBook({ dateFinished: null })
    ]

    const { currentlyReading, readByYear } = prepareBooksList(books)
    expect(currentlyReading).toHaveLength(2)
    expect(readByYear).toHaveLength(2)
    expect(readByYear[0][0]).toBe('2025')
    expect(readByYear[1][0]).toBe('2024')
  })
})
