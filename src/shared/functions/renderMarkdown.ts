import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

const mdParser = new MarkdownIt()

export const renderMarkdown = (markdown: string | null | undefined): string => {
  if (!markdown?.trim()) return ''
  return sanitizeHtml(mdParser.render(markdown))
}
