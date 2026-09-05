import type { CollectionEntry } from 'astro:content'

import type { Locale } from '@/app/i18n'

export const getNoteContentLang = (locale: Locale, note: CollectionEntry<'notes'>): Locale | undefined => {
  if (!note.data.isUntranslated) return undefined

  return locale === 'en' ? 'ru' : 'en'
}
