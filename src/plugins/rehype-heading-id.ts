interface HastNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
  value?: string
}

const HEADING = /^h[1-6]$/
// Explicit, locale-independent id authored inline, e.g. `## Heading [#my-slug]`.
// Braces (`{#id}`) can't be used here because MDX parses them as JS expressions.
const MARKER = /\s*\[#([a-z0-9-]+)]\s*$/i

export default function rehypeHeadingId() {
  return (tree: HastNode) => {
    visit(tree, node => {
      if (node.type !== 'element' || !node.tagName || !HEADING.test(node.tagName)) {
        return
      }

      const explicit = extractMarker(node)

      if (explicit) {
        node.properties = { ...node.properties, id: explicit }
        return
      }

      const id = node.properties?.id

      if (typeof id === 'string') {
        const cleaned = stripInvisible(id).replace(/^-+|-+$/g, '')

        if (cleaned !== id) {
          node.properties = { ...node.properties, id: cleaned }
        }
      }
    })
  }
}

function extractMarker(node: HastNode): null | string {
  const match = toText(node).match(MARKER)

  if (!match) return null

  const textNodes = collectTextNodes(node)
  const last = textNodes[textNodes.length - 1]

  if (last) {
    last.value = (last.value ?? '').replace(MARKER, '')
  }

  return match[1]
}

// Drop zero-width joiners (U+200B–U+200D) and variation selectors (U+FE00–U+FE0F)
// that github-slugger leaves behind after stripping an emoji, e.g. the orphan that
// turns a slug into `%EF%B8%8F-…`. Done by codepoint to avoid a misleading regex
// character class of combining marks.
function stripInvisible(value: string): string {
  let out = ''

  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    const invisible = (code >= 0x200b && code <= 0x200d) || (code >= 0xfe00 && code <= 0xfe0f)

    if (!invisible) out += char
  }

  return out
}

function collectTextNodes(node: HastNode, acc: HastNode[] = []): HastNode[] {
  if (node.type === 'text') {
    acc.push(node)
  } else if (node.children) {
    for (const child of node.children) collectTextNodes(child, acc)
  }

  return acc
}

function toText(node: HastNode): string {
  if (node.type === 'text') return node.value ?? ''
  if (!node.children) return ''

  return node.children.map(toText).join('')
}

function visit(node: HastNode, callback: (node: HastNode) => void) {
  callback(node)

  if (node.children) {
    for (const child of node.children) {
      visit(child, callback)
    }
  }
}
