import { getMarkdownPath } from './markdownAlternate'

export const requireMarkdownPath = (pathname: string): string => {
  const path = getMarkdownPath(pathname)
  if (path === null) throw new Error(`No Markdown alternate for ${pathname}`)
  return path
}
