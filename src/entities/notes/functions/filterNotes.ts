import type { CollectionEntry } from 'astro:content'

export const filterNotes = (notes: CollectionEntry<'notes'>[]) => {
  return notes.filter(note => {
    if (note.data.isDraft) return false
    if (import.meta.env.PROD && note.data.isTestNote) return false
    if (import.meta.env.SCREENSHOT_TEST_MODE && !note.data.isTestNote) return false
    return true
  })
}
