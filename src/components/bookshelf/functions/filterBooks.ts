import type { CollectionEntry } from 'astro:content'

import { IS_TESTING } from '@/shared/functions/env'

export const filterBooks = (books: CollectionEntry<'books'>[]) => {
  return books.filter(book => {
    if (IS_TESTING) return !!book.data.isTestOnly
    if (book.data.isTestOnly) return false
    return true
  })
}
