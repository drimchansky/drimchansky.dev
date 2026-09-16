import type { APIRoute, GetStaticPaths } from 'astro'

import { getCollection } from 'astro:content'

import { getLocale, supportedLocales } from '@/app/i18n'
import { filterNotes, renderNotesListMarkdown } from '@/components/notes'
import { getSiteOrigin } from '@/shared/functions/getSiteOrigin'
import { markdownResponse } from '@/shared/functions/markdownResponse'

export const getStaticPaths = (() => supportedLocales.map(lang => ({ params: { lang } }))) satisfies GetStaticPaths

export const GET: APIRoute = async ({ params, site }) => {
  const locale = getLocale(params.lang)
  const notes = await getCollection('notes', ({ id }) => id.startsWith(`${locale}/`))

  return markdownResponse(renderNotesListMarkdown(locale, getSiteOrigin(site), filterNotes(notes)))
}
