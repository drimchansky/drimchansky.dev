import type { APIRoute, GetStaticPaths } from 'astro'

import { getLocale, supportedLocales } from '@/app/i18n'
import { getSiteOrigin } from '@/shared/functions/getSiteOrigin'
import { markdownResponse } from '@/shared/functions/markdownResponse'
import { renderHomeMarkdown } from '@/shared/functions/renderHomeMarkdown'

export const getStaticPaths = (() => supportedLocales.map(lang => ({ params: { lang } }))) satisfies GetStaticPaths

export const GET: APIRoute = ({ params, site }) =>
  markdownResponse(renderHomeMarkdown(getLocale(params.lang), getSiteOrigin(site)))
