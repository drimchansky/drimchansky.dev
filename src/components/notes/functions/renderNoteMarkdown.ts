import type { CollectionEntry } from 'astro:content'

import { posix } from 'node:path'

import type { Locale } from '@/app/i18n'

import { t } from '@/app/i18n'
import { MARKER } from '@/plugins/rehype-heading-id'
import { formatIsoDate } from '@/shared/functions/formatIsoDate'

import { getNoteUrl } from './getNoteUrl'

export type NoteForMarkdown = Pick<CollectionEntry<'notes'>, 'body' | 'data' | 'filePath' | 'id'>

export type RenderNoteMarkdownOptions = {
  locale: Locale
  note: NoteForMarkdown
  resolveAsset: (projectPath: string) => string | undefined
  siteOrigin: string
}

const OPENING_FENCE = /^\s{0,3}(`{3,}|~{3,})/
const CLOSING_FENCE = /^\s{0,3}(`+|~+)\s*$/
const HEADING = /^\s{0,3}#{1,6}\s/
// `](../x.jpg` — a link or image destination that is relative to the note's source file.
const RELATIVE_DESTINATION = /(!?\[[^\]]*]\()(\.{1,2}\/[^\s)]+)/g

export const cleanNoteBody = (body: string, resolveDestination: (relativePath: string) => string) => {
  let openFence: { character: '`' | '~'; length: number } | undefined

  return body
    .split('\n')
    .map(line => {
      if (openFence) {
        const closingDelimiter = CLOSING_FENCE.exec(line)?.[1]
        if (closingDelimiter?.startsWith(openFence.character) && closingDelimiter.length >= openFence.length) {
          openFence = undefined
        }
        return line
      }

      const openingDelimiter = OPENING_FENCE.exec(line)?.[1]
      if (openingDelimiter) {
        openFence = {
          character: openingDelimiter.startsWith('`') ? '`' : '~',
          length: openingDelimiter.length
        }
        return line
      }
      if (HEADING.test(line)) return line.replace(MARKER, '')

      return line.replace(RELATIVE_DESTINATION, (_, prefix: string, destination: string) => {
        return prefix + resolveDestination(destination)
      })
    })
    .join('\n')
}

export const renderNoteMarkdown = ({ locale, note, resolveAsset, siteOrigin }: RenderNoteMarkdownOptions) => {
  const { data } = note
  const noteDir = posix.dirname(note.filePath ?? `src/content/notes/${note.id}.mdx`)

  const resolveDestination = (relativePath: string) => {
    const resolved = resolveAsset(`/${posix.join(noteDir, relativePath)}`)
    return resolved ? `${siteOrigin}${resolved}` : relativePath
  }

  const otherLocale = locale === 'en' ? 'ru' : 'en'
  const contentLang = data.isUntranslated ? otherLocale : locale

  const meta = [
    `- Published: ${formatIsoDate(data.publishingDate)}`,
    data.lastModified && `- Updated: ${formatIsoDate(data.lastModified)}`,
    `- Language: ${contentLang}`,
    `- Canonical: ${siteOrigin}${getNoteUrl(locale, note.id)}`
  ]

  return [
    `# ${data.title}`,
    data.description && `> ${data.description}`,
    meta.filter(Boolean).join('\n'),
    data.isUntranslated && `> ${t(locale, 'untranslated')}`,
    cleanNoteBody(note.body ?? '', resolveDestination).trim()
  ]
    .filter(Boolean)
    .join('\n\n')
}
