import { getCollection } from 'astro:content'

import type { Locale } from '@/app/i18n'

import { filterBooks } from './filterBooks'
import { renderBookshelfMarkdown } from './renderBookshelfMarkdown'

export const getBookshelfMarkdown = async (locale: Locale, siteOrigin: string) =>
  renderBookshelfMarkdown(locale, siteOrigin, filterBooks(await getCollection('books')))
