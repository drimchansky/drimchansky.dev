import type { CollectionEntry } from 'astro:content'

export const filterNotes = (notes: CollectionEntry<'notes'>[]) => {
  return notes.filter(note => {
    if (note.data.isDraft) return false
    return true
  })
}
