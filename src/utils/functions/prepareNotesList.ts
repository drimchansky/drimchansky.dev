import type { CollectionEntry } from 'astro:content'

import type { Locale } from '@/i18n'

export const prepareNotesList = (locale: Locale, notes: CollectionEntry<'notes'>[]) => {
  const yearFormatter = new Intl.DateTimeFormat(locale, { year: 'numeric' })

  const notesRawSortedDesc = notes
    .sort((a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime())
    .map(({ data, slug }) => {
      return {
        data,
        slug,
        url: `/${locale}/notes/${slug.split('/')[1]}`,
        year: yearFormatter.format(data.pubDate)
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
