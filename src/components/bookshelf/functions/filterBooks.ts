import type { CollectionEntry } from 'astro:content'

export const filterBooks = (books: CollectionEntry<'books'>[]) => {
  const isTesting = !!process.env.TESTING

  return books.filter(book => {
    if (isTesting) return !!book.data.isTestOnly
    if (book.data.isTestOnly) return false
    return true
  })
}
