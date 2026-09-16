import type { CollectionEntry } from 'astro:content'

import type { Locale } from '@/app/i18n'

import { getNoteSlug } from './getNoteSlug'
import { newestNoteFirst } from './newestNoteFirst'

export const prepareNotesList = (locale: Locale, notes: CollectionEntry<'notes'>[]) => {
  const yearFormatter = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', year: 'numeric' })

  const notesRawSortedDesc = notes.sort(newestNoteFirst).map(({ data, id }) => {
    return {
      data,
      id,
      url: `/${locale}/notes/${getNoteSlug(id)}`,
      year: yearFormatter.format(data.publishingDate)
    }
  })

  const notesGroupedByYear = notesRawSortedDesc.reduce(
    (acc, note) => {
      const existingGroup = acc.find(group => group[0] === note.year)
      if (existingGroup) {
        existingGroup[1].push(note)
      } else {
        acc.push([note.year, [note]])
      }
      return acc
    },
    [] as [string, typeof notesRawSortedDesc][]
  )

  return notesGroupedByYear
}
