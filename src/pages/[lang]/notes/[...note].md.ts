import type { APIRoute, GetStaticPaths } from 'astro'
import type { CollectionEntry } from 'astro:content'

import { getCollection } from 'astro:content'

import { getLocale } from '@/app/i18n'
import { filterNotes, getNoteMarkdown, getNoteSlug } from '@/components/notes'
import { getSiteOrigin } from '@/shared/functions/getSiteOrigin'
import { markdownResponse } from '@/shared/functions/markdownResponse'

export const getStaticPaths = (async () => {
  const notes = await getCollection('notes')

  return filterNotes(notes).map(note => {
    const [lang] = note.id.split('/')
    return { params: { lang, note: getNoteSlug(note.id) }, props: { note } }
  })
}) satisfies GetStaticPaths

export const GET: APIRoute<{ note: CollectionEntry<'notes'> }> = ({ params, props, site }) =>
  markdownResponse(getNoteMarkdown(getLocale(params.lang), getSiteOrigin(site), props.note))
