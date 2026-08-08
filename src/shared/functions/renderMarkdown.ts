import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

import { MARKER } from '@/plugins/rehype-heading-id'

const mdParser = new MarkdownIt()

// The `[#slug]` heading marker is consumed by the MDX rehype pipeline, which this
// renderer bypasses, so it would otherwise reach the RSS feed as visible heading text.
// Matching on heading tokens rather than raw source keeps code blocks untouched and
// still catches headings nested in blockquotes and list items, as the plugin does.
mdParser.core.ruler.push('strip_heading_id_marker', state => {
  for (const [index, token] of state.tokens.entries()) {
    if (token.type !== 'heading_open') continue

    const inline = state.tokens[index + 1]
    if (inline?.type !== 'inline' || !MARKER.test(inline.content)) continue

    const lastText = inline.children?.filter(child => child.type === 'text').pop()
    if (!lastText) continue

    inline.content = inline.content.replace(MARKER, '')
    lastText.content = lastText.content.replace(MARKER, '')
  }
})

export const renderMarkdown = (markdown: string | null | undefined): string => {
  if (!markdown?.trim()) return ''
  return sanitizeHtml(mdParser.render(markdown))
}
