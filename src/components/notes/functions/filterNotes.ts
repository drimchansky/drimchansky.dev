import type { CollectionEntry } from 'astro:content'

import { IS_TESTING } from '@/shared/functions/env'

export const filterNotes = (notes: CollectionEntry<'notes'>[]) => {
  return notes.filter(note => {
    if (note.data.isDraft) return false
    if (IS_TESTING) return !!note.data.isTestOnly
    if (note.data.isTestOnly) return false
    return true
  })
}
