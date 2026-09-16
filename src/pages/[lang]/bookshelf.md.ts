import type { APIRoute, GetStaticPaths } from 'astro'

import { getLocale, supportedLocales } from '@/app/i18n'
import { getBookshelfMarkdown } from '@/components/bookshelf'
import { getSiteOrigin } from '@/shared/functions/getSiteOrigin'
import { markdownResponse } from '@/shared/functions/markdownResponse'

export const getStaticPaths = (() => supportedLocales.map(lang => ({ params: { lang } }))) satisfies GetStaticPaths

export const GET: APIRoute = async ({ params, site }) =>
  markdownResponse(await getBookshelfMarkdown(getLocale(params.lang), getSiteOrigin(site)))
