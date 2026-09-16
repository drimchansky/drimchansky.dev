// Wrangler's esbuild bundles this file into the Pages Function at `wrangler pages deploy`, outside Astro and Vite,
// so it and everything it imports — transitively — must stay free of `astro:*` modules, `import.meta.glob` and
// `node:` built-ins. Such an import passes `astro check` and `astro build`, and breaks only at deploy.
import { supportedLocales } from '../../app/i18n'

const localePattern = supportedLocales.join('|')
const PAGE_PATH = new RegExp(`^/(${localePattern})(/[^.]*)?/?$`)
const MARKDOWN_PATH = new RegExp(`^/(${localePattern})(/[^.]*)\\.md$`)

export const getMarkdownPath = (pathname: string): string | null => {
  const match = pathname.match(PAGE_PATH)
  if (!match) return null

  const [, locale, rest = ''] = match
  const stem = rest.replace(/\/+$/, '')

  return stem ? `/${locale}${stem}.md` : `/${locale}/index.md`
}

export const getHtmlPath = (pathname: string): string | null => {
  const match = pathname.match(MARKDOWN_PATH)
  if (!match) return null

  const [, locale, stem] = match

  return stem === '/index' ? `/${locale}/` : `/${locale}${stem}/`
}

export type Representation = 'html' | 'markdown' | 'none'

type MediaRange = { q: number; type: string }

const parseAccept = (accept: string): MediaRange[] =>
  accept
    .split(',')
    .map(part => {
      const [type = '', ...params] = part.trim().split(';')
      const qParam = params.map(param => param.trim().toLowerCase()).find(param => param.startsWith('q='))
      const q = qParam ? Number(qParam.slice(2)) : 1

      return {
        q: Number.isFinite(q) ? Math.min(Math.max(q, 0), 1) : 0,
        type: type.trim().toLowerCase().replace(/^\*$/, '*/*')
      }
    })
    .filter(range => range.type)

const qualityOf = (ranges: MediaRange[], mediaType: string): number => {
  const [mainType] = mediaType.split('/')

  for (const candidate of [mediaType, `${mainType}/*`, '*/*']) {
    const range = ranges.find(({ type }) => type === candidate)
    if (range) return range.q
  }

  return 0
}

export const negotiate = (accept: string | null | undefined): Representation => {
  if (!accept?.trim()) return 'html'

  const ranges = parseAccept(accept)
  if (!ranges.some(({ type }) => ['text/html', 'text/markdown', 'text/*', '*/*'].includes(type))) return 'html'

  const html = qualityOf(ranges, 'text/html')
  const markdown = qualityOf(ranges, 'text/markdown')
  const namesMarkdown = ranges.some(({ q, type }) => type === 'text/markdown' && q > 0)

  if (html === 0 && markdown === 0) return 'none'
  if (markdown > html || (namesMarkdown && markdown === html)) return 'markdown'

  return 'html'
}
