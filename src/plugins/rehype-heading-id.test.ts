import { describe, expect, it } from 'vitest'

import rehypeHeadingId from './rehype-heading-id'

const transform = rehypeHeadingId()

// U+FE0F is the emoji variation selector that github-slugger leaves behind.
const VS = '\u{fe0f}'

function heading(value: string, id?: string) {
  return {
    children: [
      {
        children: [{ type: 'text', value }],
        properties: id === undefined ? {} : { id },
        tagName: 'h2',
        type: 'element'
      }
    ],
    type: 'root'
  }
}

describe('rehypeHeadingId', () => {
  it('uses an explicit [#slug] marker as the id', () => {
    const tree = heading('🛡️ Контроль входящей информации [#controlling-incoming-information]', 'some-auto-id')

    transform(tree)

    const h = tree.children[0] as Record<string, any>
    expect(h.properties.id).toBe('controlling-incoming-information')
  })

  it('strips the marker from the visible heading text', () => {
    const tree = heading('🗂️ Offloading Your Mind [#offloading-your-mind]', 'auto')

    transform(tree)

    const h = tree.children[0] as Record<string, any>
    expect(h.children[0].value).toBe('🗂️ Offloading Your Mind')
  })

  it('strips a leftover emoji variation selector from an auto-generated id', () => {
    const tree = heading('🛡️ Controlling Incoming Information', `${VS}-controlling-incoming-information`)

    transform(tree)

    const h = tree.children[0] as Record<string, any>
    expect(h.properties.id).toBe('controlling-incoming-information')
  })

  it('trims a leading hyphen left by a stripped emoji', () => {
    const tree = heading('🥱 Intentional Boredom', '-intentional-boredom')

    transform(tree)

    const h = tree.children[0] as Record<string, any>
    expect(h.properties.id).toBe('intentional-boredom')
  })

  it('leaves a clean auto-generated id untouched', () => {
    const tree = heading('Single Tasking', 'single-tasking')

    transform(tree)

    const h = tree.children[0] as Record<string, any>
    expect(h.properties.id).toBe('single-tasking')
  })

  it('ignores non-heading elements', () => {
    const tree = {
      children: [
        {
          children: [{ type: 'text', value: 'Text [#not-a-heading]' }],
          properties: { id: `${VS}-paragraph` },
          tagName: 'p',
          type: 'element'
        }
      ],
      type: 'root'
    }

    transform(tree)

    const p = tree.children[0] as Record<string, any>
    expect(p.properties.id).toBe(`${VS}-paragraph`)
    expect(p.children[0].value).toBe('Text [#not-a-heading]')
  })
})
