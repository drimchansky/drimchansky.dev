import type { APIRoute } from 'astro'

import { getCollection } from 'astro:content'

import { t } from '@/app/i18n'
import { getBookshelfMarkdown } from '@/components/bookshelf'
import { filterNotes, getNoteMarkdown, newestNoteFirst } from '@/components/notes'
import { getResumeMarkdown } from '@/components/resume'
import { getSiteOrigin } from '@/shared/functions/getSiteOrigin'
import { renderHomeMarkdown } from '@/shared/functions/renderHomeMarkdown'

export const GET: APIRoute = async ({ site }) => {
  const origin = getSiteOrigin(site)

  const notes = filterNotes(await getCollection('notes', ({ id }) => id.startsWith('en/'))).sort(newestNoteFirst)

  const sections = [
    `# ${t('en', 'fullName')} – full site content\n\n> Every English page of ${origin} in one Markdown file. Russian versions live under ${origin}/ru/ and have Markdown twins too, for example ${origin}/ru/index.md.`,
    renderHomeMarkdown('en', origin),
    await getResumeMarkdown('en', origin),
    ...notes.map(note => getNoteMarkdown('en', origin, note)),
    await getBookshelfMarkdown('en', origin)
  ]

  return new Response(`${sections.join('\n\n---\n\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
