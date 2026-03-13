import type { APIRoute } from 'astro'

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
  const isProd = import.meta.env.IS_PRODUCTION === '1'

  return new Response(getRobotsTxt(sitemapURL, isProd))
}
