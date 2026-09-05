import type { CollectionEntry } from 'astro:content'

import type { Locale } from '@/app/i18n'

import { getNoteSlug } from './getNoteSlug'

export const getNoteUrl = (locale: Locale, id: CollectionEntry<'notes'>['id']) => `/${locale}/notes/${getNoteSlug(id)}/`
