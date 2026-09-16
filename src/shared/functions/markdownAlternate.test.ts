import { describe, expect, it, vi } from 'vitest'

import { onRequest } from '../../../functions/_middleware'
import { getHtmlPath, getMarkdownPath, negotiate } from './markdownAlternate'

describe('getMarkdownPath', () => {
  it('maps a locale root to index.md', () => {
    expect(getMarkdownPath('/en/')).toBe('/en/index.md')
    expect(getMarkdownPath('/ru')).toBe('/ru/index.md')
  })

  it('maps a page path with or without a trailing slash', () => {
    expect(getMarkdownPath('/en/resume/')).toBe('/en/resume.md')
    expect(getMarkdownPath('/en/resume')).toBe('/en/resume.md')
    expect(getMarkdownPath('/ru/notes/foo/')).toBe('/ru/notes/foo.md')
  })

  it('returns null for paths without a locale prefix or with a file extension', () => {
    expect(getMarkdownPath('/')).toBeNull()
    expect(getMarkdownPath('/404')).toBeNull()
    expect(getMarkdownPath('/en/feed.xml')).toBeNull()
    expect(getMarkdownPath('/en/resume.md')).toBeNull()
    expect(getMarkdownPath('/english/')).toBeNull()
    expect(getMarkdownPath('/files/resume.pdf')).toBeNull()
  })
})

describe('getHtmlPath', () => {
  it('maps index.md back to the locale root', () => {
    expect(getHtmlPath('/en/index.md')).toBe('/en/')
  })

  it('maps a Markdown path back to the page path with a trailing slash', () => {
    expect(getHtmlPath('/en/resume.md')).toBe('/en/resume/')
    expect(getHtmlPath('/ru/notes/foo.md')).toBe('/ru/notes/foo/')
  })

  it('returns null for anything that is not a localized Markdown path', () => {
    expect(getHtmlPath('/en/resume/')).toBeNull()
    expect(getHtmlPath('/llms.txt')).toBeNull()
    expect(getHtmlPath('/index.md')).toBeNull()
  })
})

describe('negotiate', () => {
  it('defaults to HTML without an Accept header or with a wildcard', () => {
    expect(negotiate(null)).toBe('html')
    expect(negotiate('')).toBe('html')
    expect(negotiate('*/*')).toBe('html')
    expect(negotiate('text/*')).toBe('html')
  })

  it('keeps HTML for a browser Accept header', () => {
    expect(negotiate('text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8')).toBe(
      'html'
    )
  })

  it('serves Markdown when it is explicitly named and ties with HTML', () => {
    expect(negotiate('text/markdown, text/html')).toBe('markdown')
    expect(negotiate('text/html, text/markdown')).toBe('markdown')
  })

  it('serves Markdown when it outranks HTML', () => {
    expect(negotiate('text/markdown')).toBe('markdown')
    expect(negotiate('text/markdown;q=0.9, */*;q=0.8')).toBe('markdown')
    expect(negotiate('text/*;q=0.5, text/html;q=0')).toBe('markdown')
  })

  it('keeps HTML when Markdown is named with a lower quality', () => {
    expect(negotiate('text/html, text/markdown;q=0.5')).toBe('html')
    expect(negotiate('TEXT/HTML;q=1.0, text/markdown; Q=0.1')).toBe('html')
  })

  it('reports when neither representation is acceptable', () => {
    expect(negotiate('application/json')).toBe('html')
    expect(negotiate('image/avif,image/webp')).toBe('html')
    expect(negotiate('text/html;q=0')).toBe('none')
    expect(negotiate('text/markdown;q=0, text/html;q=0, image/png')).toBe('none')
  })
})

describe('Markdown middleware responses', () => {
  it.each(['POST', 'PUT'])('passes %s requests through without fetching an asset', async method => {
    const downstream = new Response('Handled downstream', { status: 201 })
    const fetchAsset = vi.fn()
    const next = vi.fn(async () => downstream)
    const response = await onRequest({
      env: { ASSETS: { fetch: fetchAsset } },
      next,
      request: new Request('https://example.com/en/resume/', { method })
    })

    expect(response).toBe(downstream)
    expect(fetchAsset).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
  })

  it('passes non-page assets through without fetching Markdown', async () => {
    const downstream = new Response('<rss />', { headers: { 'Content-Type': 'application/xml' } })
    const fetchAsset = vi.fn()
    const next = vi.fn(async () => downstream)
    const response = await onRequest({
      env: { ASSETS: { fetch: fetchAsset } },
      next,
      request: new Request('https://example.com/en/feed.xml')
    })

    expect(response).toBe(downstream)
    expect(fetchAsset).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
  })

  it('adds the Markdown alternate to a successful HTML response without replacing existing links', async () => {
    const fetchAsset = vi.fn()
    const next = vi.fn(
      async () =>
        new Response('<html>Resume</html>', {
          headers: { Link: '</styles.css>; rel="preload"', Vary: 'Accept-Encoding' }
        })
    )
    const response = await onRequest({
      env: { ASSETS: { fetch: fetchAsset } },
      next,
      request: new Request('https://example.com/en/resume/', { headers: { Accept: 'text/html' } })
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Link')).toBe(
      '</styles.css>; rel="preload", </en/resume.md>; rel="alternate"; type="text/markdown"'
    )
    expect(response.headers.get('Vary')).toBe('Accept-Encoding, Accept')
    expect(await response.text()).toBe('<html>Resume</html>')
    expect(fetchAsset).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
  })

  describe.each(['GET', 'HEAD'])('HTML redirects for %s', method => {
    it.each([301, 302, 303, 307, 308])('varies a %s redirect by Accept and preserves its headers', async status => {
      const fetchAsset = vi.fn()
      const next = vi.fn(
        async () =>
          new Response(null, {
            headers: {
              'Cache-Control': 'public, max-age=3600',
              Location: '/en/resume/',
              Vary: 'Accept-Encoding'
            },
            status
          })
      )
      const response = await onRequest({
        env: { ASSETS: { fetch: fetchAsset } },
        next,
        request: new Request('https://example.com/en/resume', { headers: { Accept: 'text/html' }, method })
      })

      expect(response.status).toBe(status)
      expect(response.headers.get('Location')).toBe('/en/resume/')
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
      expect(response.headers.get('Vary')).toBe('Accept-Encoding, Accept')
      expect(response.headers.get('Link')).toBeNull()
      expect(await response.text()).toBe('')
      expect(fetchAsset).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledOnce()
    })
  })

  it('passes through a missing direct Markdown asset', async () => {
    const missing = new Response('Missing Markdown', { headers: { 'X-Asset': 'missing' }, status: 404 })
    const fetchAsset = vi.fn<(request: Request) => Promise<Response>>(async () => missing)
    const next = vi.fn()
    const response = await onRequest({
      env: { ASSETS: { fetch: fetchAsset } },
      next,
      request: new Request('https://example.com/en/missing.md')
    })

    expect(response).toBe(missing)
    expect(response.headers.get('X-Asset')).toBe('missing')
    expect(fetchAsset).toHaveBeenCalledOnce()
    expect(fetchAsset.mock.calls[0]?.[0].url).toBe('https://example.com/en/missing.md')
    expect(next).not.toHaveBeenCalled()
  })

  it('falls back to HTML when negotiated Markdown is missing', async () => {
    const events: string[] = []
    const missingBody = new ReadableStream({
      async cancel() {
        await Promise.resolve()
        events.push('cancelled')
      }
    })
    const fetchAsset = vi.fn<(request: Request) => Promise<Response>>(
      async () => new Response(missingBody, { status: 404 })
    )
    const next = vi.fn(async () => {
      events.push('next')
      return new Response('<html>Fallback</html>')
    })
    const response = await onRequest({
      env: { ASSETS: { fetch: fetchAsset } },
      next,
      request: new Request('https://example.com/en/missing/', { headers: { Accept: 'text/markdown' } })
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Link')).toBe('</en/missing.md>; rel="alternate"; type="text/markdown"')
    expect(response.headers.get('Vary')).toBe('Accept')
    expect(await response.text()).toBe('<html>Fallback</html>')
    expect(fetchAsset).toHaveBeenCalledOnce()
    expect(fetchAsset.mock.calls[0]?.[0].url).toBe('https://example.com/en/missing.md')
    expect(next).toHaveBeenCalledOnce()
    expect(events).toEqual(['cancelled', 'next'])
  })

  it('falls back to HTML for a missing HEAD Markdown asset without a body', async () => {
    const fetchAsset = vi.fn(async () => new Response(null, { status: 404 }))
    const next = vi.fn(async () => new Response(null))
    const response = await onRequest({
      env: { ASSETS: { fetch: fetchAsset } },
      next,
      request: new Request('https://example.com/en/missing/', {
        headers: { Accept: 'text/markdown' },
        method: 'HEAD'
      })
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Link')).toBe('</en/missing.md>; rel="alternate"; type="text/markdown"')
    expect(response.headers.get('Vary')).toBe('Accept')
    expect(await response.text()).toBe('')
    expect(fetchAsset).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledOnce()
  })

  it('passes through an HTML error response without adding negotiation headers', async () => {
    const htmlError = new Response('Server error', { headers: { 'X-Error': 'upstream' }, status: 500 })
    const fetchAsset = vi.fn()
    const next = vi.fn(async () => htmlError)
    const response = await onRequest({
      env: { ASSETS: { fetch: fetchAsset } },
      next,
      request: new Request('https://example.com/en/resume/', { headers: { Accept: 'text/html' } })
    })

    expect(response).toBe(htmlError)
    expect(response.headers.get('Link')).toBeNull()
    expect(response.headers.get('Vary')).toBeNull()
    expect(response.headers.get('X-Error')).toBe('upstream')
    expect(fetchAsset).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
  })

  it('adds security headers when no representation is acceptable', async () => {
    const fetchAsset = vi.fn()
    const next = vi.fn()
    const response = await onRequest({
      env: { ASSETS: { fetch: fetchAsset } },
      next,
      request: new Request('https://example.com/en/resume/', {
        headers: { Accept: 'text/html;q=0, text/markdown;q=0' }
      })
    })

    expect(response.status).toBe(406)
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8')
    expect(response.headers.get('Vary')).toBe('Accept')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    expect(await response.text()).toBe('Not Acceptable')
    expect(fetchAsset).not.toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })
})

describe('Markdown middleware conditional responses', () => {
  it('preserves negotiation headers on an HTML 304', async () => {
    const response = await onRequest({
      env: { ASSETS: { fetch: vi.fn() } },
      next: async () => new Response(null, { headers: { ETag: '"current"', Vary: 'Accept-Encoding' }, status: 304 }),
      request: new Request('https://example.com/en/resume/', {
        headers: { Accept: 'text/html', 'If-None-Match': '"current"' }
      })
    })

    expect(response.status).toBe(304)
    expect(response.headers.get('Vary')).toBe('Accept-Encoding, Accept')
    expect(response.headers.get('Link')).toContain('rel="alternate"')
    expect(response.headers.get('ETag')).toBe('"current"')
    expect(await response.text()).toBe('')
  })

  describe.each(['/en/resume/', '/en/resume.md'])('successful Markdown at %s without a validator', pathname => {
    it.each(['GET', 'HEAD'])('%s', async method => {
      const fetchAsset = vi.fn(
        async (assetRequest: Request) =>
          new Response(assetRequest.method === 'HEAD' ? null : '# Resume', {
            headers: { 'Cache-Control': 'public, max-age=0, must-revalidate', Vary: 'Accept-Encoding' }
          })
      )
      const next = vi.fn()
      const response = await onRequest({
        env: { ASSETS: { fetch: fetchAsset } },
        next,
        request: new Request(`https://example.com${pathname}`, {
          headers: { Accept: 'text/markdown' },
          method
        })
      })

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8')
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate')
      expect(response.headers.get('Vary')).toBe(
        pathname.endsWith('.md') ? 'Accept-Encoding' : 'Accept-Encoding, Accept'
      )
      expect(response.headers.get('Link')).toBe(
        '</en/resume/>; rel="alternate"; type="text/html", <https://drimchansky.dev/en/resume/>; rel="canonical"'
      )
      expect(response.headers.get('Content-Location')).toBe(pathname.endsWith('.md') ? null : '/en/resume.md')
      expect(await response.text()).toBe(method === 'HEAD' ? '' : '# Resume')
      expect(fetchAsset).toHaveBeenCalledOnce()
      expect(fetchAsset.mock.calls[0]?.[0].headers.has('If-None-Match')).toBe(false)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe.each(['/en/resume/', '/en/resume.md'])('conditional Markdown at %s', pathname => {
    describe.each(['GET', 'HEAD'])('%s', method => {
      it.each([
        ['*', '"current"', 304],
        ['"older", "current"', '"current"', 304],
        ['W/"current"', '"current"', 304],
        ['"current"', 'W/"current"', 304],
        ['"older", "current,revision"', '"current,revision"', 304],
        ['"older"', '"current"', 200]
      ])('evaluates %s against the asset ETag %s', async (validator, etag, status) => {
        const fetchAsset = vi.fn(
          async (assetRequest: Request) =>
            new Response(assetRequest.method === 'HEAD' ? null : '# Resume', {
              headers: { 'Cache-Control': 'public, max-age=0, must-revalidate', ETag: etag, Vary: 'Accept-Encoding' }
            })
        )
        const next = vi.fn(async () => new Response(null, { status: 304 }))
        const response = await onRequest({
          env: { ASSETS: { fetch: fetchAsset } },
          next,
          request: new Request(`https://example.com${pathname}`, {
            headers: { Accept: 'text/markdown', 'If-None-Match': validator },
            method
          })
        })

        expect(response.status).toBe(status)
        expect(response.headers.get('ETag')).toBe(etag)
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate')
        expect(response.headers.get('Vary')).toBe(
          pathname.endsWith('.md') ? 'Accept-Encoding' : 'Accept-Encoding, Accept'
        )
        expect(response.headers.get('Link')).toBe(
          '</en/resume/>; rel="alternate"; type="text/html", <https://drimchansky.dev/en/resume/>; rel="canonical"'
        )
        expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8')
        expect(response.headers.get('Content-Location')).toBe(pathname.endsWith('.md') ? null : '/en/resume.md')
        expect(await response.text()).toBe(status === 304 || method === 'HEAD' ? '' : '# Resume')
        expect(fetchAsset).toHaveBeenCalledOnce()
        expect(fetchAsset.mock.calls[0]?.[0].url).toBe('https://example.com/en/resume.md')
        expect(fetchAsset.mock.calls[0]?.[0].method).toBe(method)
        expect(fetchAsset.mock.calls[0]?.[0].headers.has('If-None-Match')).toBe(false)
        expect(next).not.toHaveBeenCalled()
      })
    })
  })

  it.each(['GET', 'HEAD'])('does not invent a validator when the %s asset has no ETag', async method => {
    const response = await onRequest({
      env: { ASSETS: { fetch: async () => new Response(method === 'HEAD' ? null : '# Resume') } },
      next: vi.fn(),
      request: new Request('https://example.com/en/resume/', {
        headers: { Accept: 'text/markdown', 'If-None-Match': '"older", "current"' },
        method
      })
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('ETag')).toBeNull()
    expect(await response.text()).toBe(method === 'HEAD' ? '' : '# Resume')
  })
})
