import type { CollectionEntry } from 'astro:content'

import type { Locale } from '@/app/i18n'

import { t } from '@/app/i18n'
import { formatIsoDate } from '@/shared/functions/formatIsoDate'
import { getRssUrl } from '@/shared/functions/getRssUrl'
import { requireMarkdownPath } from '@/shared/functions/requireMarkdownPath'

import { prepareNotesList } from './prepareNotesList'

export const renderNotesListMarkdown = (locale: Locale, siteOrigin: string, notes: CollectionEntry<'notes'>[]) => {
  const groups = prepareNotesList(locale, notes).map(([year, yearNotes]) => {
    const items = yearNotes.map(({ data, url }) => {
      const line = `- [${data.title}](${siteOrigin}${requireMarkdownPath(url)}) — ${formatIsoDate(data.publishingDate)}`
      return data.description ? `${line}\n  ${data.description}` : line
    })

    return `## ${year}\n\n${items.join('\n')}`
  })

  return [
    `# ${t(locale, 'notes')}`,
    [`- Canonical: ${siteOrigin}/${locale}/notes/`, `- RSS: ${getRssUrl(siteOrigin, locale)}`].join('\n'),
    ...groups
  ].join('\n\n')
}
