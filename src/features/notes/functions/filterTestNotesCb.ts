import type { CollectionEntry } from 'astro:content'

export const filterTestNotesCb = (note: CollectionEntry<'notes'>) => {
  return !(note.data.isTestNote && import.meta.env.PROD)
}
