// Wrangler's esbuild bundles this file at `wrangler pages deploy`, outside Astro and Vite, so it and everything it
// imports — transitively — must stay free of `astro:*` modules, `import.meta.glob` and `node:` built-ins. Such an
// import passes `astro check` and `astro build`, and breaks only at deploy.
import { getHtmlPath, getMarkdownPath, negotiate } from '../src/shared/functions/markdownAlternate'
import { MARKDOWN_CONTENT_TYPE } from '../src/shared/functions/markdownResponse'
import { siteInfo } from '../src/shared/site-info'

type PagesContext = {
  env: { ASSETS: { fetch(request: Request): Promise<Response> } }
  next(): Promise<Response>
  request: Request
}

const LIST_VALUED_HEADERS = new Set(['link', 'vary'])

const alternateLink = (path: string, type: string) => `<${path}>; rel="alternate"; type="${type}"`

const canonicalLink = (path: string) => `<https://${siteInfo.url}${path}>; rel="canonical"`

const withHeaders = (response: Response, headers: Record<string, string>) => {
  const result = new Response(response.body, response)
  for (const [name, value] of Object.entries(headers)) {
    if (LIST_VALUED_HEADERS.has(name.toLowerCase())) result.headers.append(name, value)
    else result.headers.set(name, value)
  }
  return result
}

const withMarkdownResponse = async (markdown: Response, request: Request, headers: Record<string, string>) => {
  const ifNoneMatch = request.headers.get('If-None-Match')
  const etag = markdown.headers.get('ETag')
  const validators = ifNoneMatch?.match(/(?:W\/)?"[^"]*"/g) ?? []
  const isNotModified =
    ifNoneMatch?.trim() === '*' ||
    (etag !== null && validators.some(validator => validator.replace(/^W\//, '') === etag.replace(/^W\//, '')))

  if (markdown.status === 200 && isNotModified) {
    await markdown.body?.cancel()
    markdown = new Response(null, { headers: markdown.headers, status: 304 })
  }

  return withHeaders(markdown, {
    ...headers,
    'Content-Type': MARKDOWN_CONTENT_TYPE
  })
}

export const onRequest = async ({ env, next, request }: PagesContext): Promise<Response> => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return next()

  const url = new URL(request.url)

  const htmlPath = getHtmlPath(url.pathname)
  if (htmlPath) {
    const markdown = await env.ASSETS.fetch(new Request(url, { method: request.method }))
    if (!markdown.ok) return markdown

    return withMarkdownResponse(markdown, request, {
      Link: `${alternateLink(htmlPath, 'text/html')}, ${canonicalLink(htmlPath)}`
    })
  }

  const markdownPath = getMarkdownPath(url.pathname)
  if (!markdownPath) return next()

  const representation = negotiate(request.headers.get('Accept'))

  if (representation === 'none') {
    return new Response('Not Acceptable', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        Vary: 'Accept',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      },
      status: 406
    })
  }

  if (representation === 'markdown') {
    const markdown = await env.ASSETS.fetch(
      new Request(new URL(markdownPath, url), {
        method: request.method
      })
    )

    if (markdown.ok) {
      const htmlPath = getHtmlPath(markdownPath)!
      return withMarkdownResponse(markdown, request, {
        'Content-Location': markdownPath,
        Link: `${alternateLink(htmlPath, 'text/html')}, ${canonicalLink(htmlPath)}`,
        Vary: 'Accept'
      })
    }

    await markdown.body?.cancel()
  }

  const html = await next()
  if (html.status >= 300 && html.status < 400 && html.status !== 304) {
    return withHeaders(html, { Vary: 'Accept' })
  }
  if (!html.ok && html.status !== 304) return html

  return withHeaders(html, {
    Link: alternateLink(markdownPath, 'text/markdown'),
    Vary: 'Accept'
  })
}
