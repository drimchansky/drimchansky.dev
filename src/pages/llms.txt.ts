import type { APIRoute } from 'astro'

import { getCollection } from 'astro:content'

import { t } from '@/app/i18n'
import { filterNotes, getNoteUrl, newestNoteFirst } from '@/components/notes'
import { RESUME_FILENAMES_BY_LOCALE } from '@/components/resume'
import { formatIsoDate } from '@/shared/functions/formatIsoDate'
import { getRssUrl } from '@/shared/functions/getRssUrl'
import { getSiteOrigin } from '@/shared/functions/getSiteOrigin'
import { requireMarkdownPath } from '@/shared/functions/requireMarkdownPath'

// https://llmstxt.org — a curated entry point for LLMs, not a sitemap.
export const GET: APIRoute = async ({ site }) => {
  const origin = getSiteOrigin(site)
  const md = (path: string) => `${origin}${requireMarkdownPath(path)}`

  const notes = filterNotes(await getCollection('notes', ({ id }) => id.startsWith('en/'))).sort(newestNoteFirst)

  const noteItems = notes.map(({ data, id }) => {
    const summary = data.description ?? `Published ${formatIsoDate(data.publishingDate)}`
    return `- [${data.title}](${md(getNoteUrl('en', id))}): ${summary}`
  })

  const body = `# ${t('en', 'fullName')}

> ${t('en', 'siteDescription')}. ${t('en', 'intro')}, based in ${t('en', 'location')}. The site holds his resume, notes on web development and working with AI tools, and a bookshelf with ratings. Every page is available in English and Russian, and every page has a Markdown twin: replace the trailing slash with \`.md\` (\`/en/resume/\` becomes \`/en/resume.md\`); the locale roots are \`/en/index.md\` and \`/ru/index.md\`.

## Pages

- [Home](${md('/en/')}): Introduction and contact links
- [Resume](${md('/en/resume/')}): Experience, education, skills and languages; also as PDF at ${origin}/files/${encodeURIComponent(RESUME_FILENAMES_BY_LOCALE.en)}.pdf
- [Bookshelf](${md('/en/bookshelf/')}): Books read by year with ratings, plus what is being read now

## Notes

${noteItems.join('\n')}

## Russian

- [${t('ru', 'home')}](${md('/ru/')}): Home page in Russian
- [${t('ru', 'resume')}](${md('/ru/resume/')}): Resume in Russian
- [${t('ru', 'notes')}](${md('/ru/notes/')}): The same notes in Russian
- [${t('ru', 'bookshelf')}](${md('/ru/bookshelf/')}): Bookshelf in Russian

## Optional

- [Full content](${origin}/llms-full.txt): Every English page concatenated into one Markdown file
- [RSS feed](${getRssUrl(origin, 'en')}): Notes feed
`

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
