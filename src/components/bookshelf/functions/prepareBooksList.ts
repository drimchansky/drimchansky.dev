import type { CollectionEntry } from 'astro:content'

type Book = CollectionEntry<'books'>
type ReadBook = Book & { data: { dateFinished: string } }

export type BooksByYear = [string, ReadBook[]][]

export const prepareBooksList = (books: Book[]) => {
  const currentlyReading = books.filter(b => !b.data.dateFinished)

  const read = books
    .filter((b): b is ReadBook => !!b.data.dateFinished)
    .sort((a, b) => b.data.dateFinished.localeCompare(a.data.dateFinished))

  const readByYear = read.reduce<BooksByYear>((acc, book) => {
    const year = book.data.dateFinished.slice(0, 4)
    const group = acc.find(g => g[0] === year)
    if (group) {
      group[1].push(book)
    } else {
      acc.push([year, [book]])
    }
    return acc
  }, [])

  const allBooks = [...currentlyReading, ...read]
  const counted = allBooks.filter(b => !b.data.skipped)
  const counts = {
    all: counted.length,
    fiction: counted.filter(b => b.data.fiction === true).length,
    nonFiction: counted.filter(b => b.data.fiction === false).length
  }

  return { counts, currentlyReading, readByYear }
}
