import { describe, expect, it } from 'vitest'

import { requireMarkdownPath } from './requireMarkdownPath'

describe('requireMarkdownPath', () => {
  it('returns Markdown URLs for supported pages', () => {
    expect(requireMarkdownPath('/en/')).toBe('/en/index.md')
    expect(requireMarkdownPath('/ru/notes/a/')).toBe('/ru/notes/a.md')
  })

  it('fails the build rather than interpolating null for unsupported paths', () => {
    expect(() => requireMarkdownPath('/en/notes/a.b/')).toThrow('No Markdown alternate for /en/notes/a.b/')
  })
})
