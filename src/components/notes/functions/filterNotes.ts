import type { CollectionEntry } from 'astro:content'

export const filterNotes = (notes: CollectionEntry<'notes'>[]) => {
  const isTesting = !!process.env.TESTING

  return notes.filter(note => {
    if (note.data.isDraft) return false
    if (isTesting) return !!note.data.isTestOnly
    if (note.data.isTestOnly) return !import.meta.env.PROD
    return true
  })
}
