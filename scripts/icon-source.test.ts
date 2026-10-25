import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { parseIconSource } from './icon-source.ts'

const ROOT = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
const TILE = '<path fill="#051116" d="M0 0H512V512H0Z" />'
const iconSource = (body: string, root = ROOT) => `${root}\n  ${body}\n</svg>\n`

describe('parseIconSource', () => {
  it('reads the committed mark as the tile followed by the letter', () => {
    const { paths, viewBox } = parseIconSource(
      readFileSync(new URL('../src/shared/assets/brand/mark.svg', import.meta.url), 'utf8')
    )

    expect(viewBox).toBe('0 0 512 512')
    expect(paths.map(({ fill }) => fill)).toEqual(['#051116', '#00d395'])
  })

  it.each([
    ['a comment', iconSource(`<!-- note -->\n  ${TILE}`), 'must not contain comments'],
    [
      'an element other than svg and path',
      iconSource(`<g>${TILE}</g>`),
      'may only contain svg and path elements; found g'
    ],
    [
      'a second svg element',
      iconSource(`<svg viewBox="0 0 1 1"></svg>\n  ${TILE}`),
      'must contain exactly one svg element'
    ],
    [
      'a root attribute other than xmlns and viewBox',
      iconSource(TILE, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512">'),
      'may only have xmlns and viewBox attributes; found width'
    ],
    [
      'a path attribute other than d and fill',
      iconSource('<path fill="#051116" d="M0 0H512V512H0Z" stroke="#000000" />'),
      'may only have d and fill attributes; found stroke'
    ],
    [
      'an unquoted attribute',
      iconSource('<path fill="#051116" d="M0 0H512V512H0Z" stroke=1 />'),
      'must have a quoted value; found stroke=1'
    ],
    [
      'a fill that is not a six-digit hex colour',
      iconSource('<path fill="red" d="M0 0H512V512H0Z" />'),
      'must provide a d attribute and a hex fill'
    ],
    ['a quote in path data', iconSource('<path fill="#051116" d="M0 0\'H512V512H0Z" />'), 'may only contain path data'],
    [
      'a viewBox that is not square',
      iconSource(TILE, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 256">'),
      'must have a finite square viewBox'
    ]
  ])('rejects %s', (_, source, message) => {
    expect(() => parseIconSource(source)).toThrow(message)
  })
})
