import { describe, expect, it } from 'vitest'

import rehypeFigureCaption from './rehype-figure-caption'

const transform = rehypeFigureCaption()

describe('rehypeFigureCaption', () => {
  it('transforms image with title into figure with figcaption', () => {
    const tree = {
      children: [
        {
          children: [
            {
              children: [],
              properties: { alt: 'A photo', src: 'photo.jpg', title: 'Photo caption' },
              tagName: 'img',
              type: 'element'
            }
          ],
          properties: {},
          tagName: 'p',
          type: 'element'
        }
      ],
      type: 'root'
    }

    transform(tree)

    const figure = tree.children[0] as Record<string, any>
    expect(figure.tagName).toBe('figure')
    expect(figure.children).toHaveLength(2)
    expect(figure.children[0].tagName).toBe('img')
    expect(figure.children[1].tagName).toBe('figcaption')
    expect(figure.children[1].children[0].value).toBe('Photo caption')
  })

  it('removes title from the img element', () => {
    const tree = {
      children: [
        {
          children: [
            {
              children: [],
              properties: { src: 'photo.jpg', title: 'Caption' },
              tagName: 'img',
              type: 'element'
            }
          ],
          properties: {},
          tagName: 'p',
          type: 'element'
        }
      ],
      type: 'root'
    }

    transform(tree)

    const img = tree.children[0].children[0]
    expect(img.properties.title).toBeUndefined()
  })

  it('leaves image without title untouched', () => {
    const tree = {
      children: [
        {
          children: [
            {
              children: [],
              properties: { alt: 'A photo', src: 'photo.jpg' },
              tagName: 'img',
              type: 'element'
            }
          ],
          properties: {},
          tagName: 'p',
          type: 'element'
        }
      ],
      type: 'root'
    }

    transform(tree)

    expect(tree.children[0].tagName).toBe('p')
  })

  it('does not transform paragraph with image and text', () => {
    const tree = {
      children: [
        {
          children: [
            { type: 'text', value: 'Some text ' },
            {
              children: [],
              properties: { src: 'photo.jpg', title: 'Caption' },
              tagName: 'img',
              type: 'element'
            }
          ],
          properties: {},
          tagName: 'p',
          type: 'element'
        }
      ],
      type: 'root'
    }

    transform(tree)

    expect(tree.children[0].tagName).toBe('p')
    expect(tree.children[0].children).toHaveLength(2)
  })
})
