import { describe, expect, it } from 'vitest'

import { renderMarkdown } from './renderMarkdown'

describe('renderMarkdown', () => {
  it('strips the explicit heading id marker', () => {
    expect(renderMarkdown('## Related reading [#related-reading]')).toBe('<h2>Related reading</h2>\n')
  })

  it('strips the marker from a non-latin heading', () => {
    expect(renderMarkdown('## Другие статьи по теме [#related-reading]')).toBe(
      '<h2>Другие статьи по теме</h2>\n'
    )
  })

  it('strips the marker from a heading with inline formatting', () => {
    expect(renderMarkdown('## **Bold** tail [#slug]')).toBe('<h2><strong>Bold</strong> tail</h2>\n')
  })

  it('strips the marker from a blockquoted heading', () => {
    expect(renderMarkdown('> ## Quoted heading [#slug]')).toBe(
      '<blockquote>\n<h2>Quoted heading</h2>\n</blockquote>\n'
    )
  })

  it('strips the marker from a heading inside a list item', () => {
    expect(renderMarkdown('- ## List heading [#slug]')).toBe('<ul>\n<li>\n<h2>List heading</h2>\n</li>\n</ul>\n')
  })

  it('strips the marker from a setext heading', () => {
    expect(renderMarkdown('Related reading [#related-reading]\n---')).toBe('<h2>Related reading</h2>\n')
  })

  it('leaves a marker inside a fenced code block untouched', () => {
    expect(renderMarkdown('```md\n## Heading [#slug]\n```')).toBe(
      '<pre><code>## Heading [#slug]\n</code></pre>\n'
    )
  })

  it('keeps the block after a marked heading separate', () => {
    expect(renderMarkdown('## Heading [#slug]\n\nBody paragraph')).toBe(
      '<h2>Heading</h2>\n<p>Body paragraph</p>\n'
    )
  })

  it('keeps a marker-shaped string that is not a heading suffix', () => {
    expect(renderMarkdown('See [#hash] in the text')).toBe('<p>See [#hash] in the text</p>\n')
  })

  it('renders a heading without a marker unchanged', () => {
    expect(renderMarkdown('## Plain heading')).toBe('<h2>Plain heading</h2>\n')
  })

  it('returns an empty string for blank input', () => {
    expect(renderMarkdown('   ')).toBe('')
  })
})
