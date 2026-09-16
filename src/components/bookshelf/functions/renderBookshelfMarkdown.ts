import type { CollectionEntry } from 'astro:content'

import type { Locale } from '@/app/i18n'

import { t } from '@/app/i18n'

import { getBookText } from './getBookText'
import { prepareBooksList } from './prepareBooksList'

type Book = CollectionEntry<'books'>

const langLabels = { en: 'langEn', ru: 'langRu' } as const

const renderBook = ({ data }: Book, locale: Locale, numberFormatter: Intl.NumberFormat) => {
  const title = getBookText(data.title, locale)
  const author = getBookText(data.author, locale)

  const rating =
    data.rating !== null && data.rating > 0 && !data.skipped
      ? t(locale, 'ratingLabel').replace('{rating}', numberFormatter.format(data.rating))
      : undefined

  const line = [
    `**${title}** — ${author}`,
    rating,
    data.skipped && t(locale, 'skipped'),
    t(locale, langLabels[data.language])
  ]
    .filter(Boolean)
    .join(' · ')

  const description = data.description?.[locale]?.trim()
  if (!description) return `- ${line}`

  return `- ${line}\n\n${description.replace(/^(?=.)/gm, '  ')}`
}

export const renderBookshelfMarkdown = (locale: Locale, siteOrigin: string, books: Book[]) => {
  const { counts, currentlyReading, readByYear } = prepareBooksList(books)
  const numberFormatter = new Intl.NumberFormat(locale)
  const render = (book: Book) => renderBook(book, locale, numberFormatter)

  const groups = readByYear.map(([year, yearBooks]) => `## ${year}\n\n${yearBooks.map(render).join('\n')}`)

  return [
    `# ${t(locale, 'bookshelf')}`,
    [
      `- Canonical: ${siteOrigin}/${locale}/bookshelf/`,
      `- ${t(locale, 'all')}: ${counts.all} · ${t(locale, 'fiction')}: ${counts.fiction} · ${t(locale, 'nonFiction')}: ${counts.nonFiction}`
    ].join('\n'),
    currentlyReading.length > 0 && `## ${t(locale, 'currentlyReading')}\n\n${currentlyReading.map(render).join('\n')}`,
    ...groups
  ]
    .filter(Boolean)
    .join('\n\n')
}
