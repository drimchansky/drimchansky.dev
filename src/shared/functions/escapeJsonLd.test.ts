import { describe, expect, it } from 'vitest'

import { escapeJsonLd } from './escapeJsonLd'

describe('escapeJsonLd', () => {
  it('escapes the closing tag that would end an inline script block', () => {
    expect(escapeJsonLd({ description: 'ends here </script>' })).toBe('{"description":"ends here \\u003c/script>"}')
  })

  it('escapes an angle bracket that is not part of a closing tag', () => {
    expect(escapeJsonLd({ description: 'a < b' })).toBe('{"description":"a \\u003c b"}')
  })

  it('leaves the escaped output parsing back to the original value', () => {
    const value = { description: '</script><script>alert(1)</script>' }

    expect(JSON.parse(escapeJsonLd(value))).toEqual(value)
  })

  it('serializes a value without angle brackets unchanged', () => {
    expect(escapeJsonLd({ '@type': 'Person', name: 'Nikita' })).toBe('{"@type":"Person","name":"Nikita"}')
  })
})
