import type { Locale } from '@/app/i18n'

export const getBookText = (text: Record<Locale, string>, locale: Locale) => text[locale] || text.en || text.ru
