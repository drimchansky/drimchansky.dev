interface HastNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
  value?: string
}

export default function rehypeFigureCaption() {
  return (tree: HastNode) => {
    visit(tree, node => {
      if (!node.children) return

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i]

        if (child.type !== 'element' || child.tagName !== 'p' || child.children?.length !== 1) {
          continue
        }

        const img = child.children[0]

        if (img.type !== 'element' || img.tagName !== 'img' || !img.properties?.title) {
          continue
        }

        const caption = String(img.properties.title)
        delete img.properties.title

        child.tagName = 'figure'
        child.children = [
          img,
          {
            children: [{ type: 'text', value: caption }],
            properties: {},
            tagName: 'figcaption',
            type: 'element'
          }
        ]
      }
    })
  }
}

function visit(node: HastNode, callback: (node: HastNode) => void) {
  callback(node)
  if (node.children) {
    for (const child of node.children) {
      visit(child, callback)
    }
  }
}
