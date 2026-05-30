import type { APIRoute } from 'astro'

import { IS_PRODUCTION } from '@/shared/functions/env'

const getRobotsTxt = (sitemapURL: URL, isProd: boolean) => {
  if (isProd) {
    return `
      User-agent: *
      Allow: /

      Sitemap: ${sitemapURL.href}
    `
  }

  return `
    User-agent: *
    Disallow: /
  `
}

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site)

  return new Response(getRobotsTxt(sitemapURL, IS_PRODUCTION))
}
