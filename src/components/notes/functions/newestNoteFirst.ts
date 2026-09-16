import type { CollectionEntry } from 'astro:content'

type DatedNote = Pick<CollectionEntry<'notes'>, 'data'>

export const newestNoteFirst = (a: DatedNote, b: DatedNote) =>
  b.data.publishingDate.getTime() - a.data.publishingDate.getTime()
