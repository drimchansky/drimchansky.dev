import { describe, expect, it } from 'vitest'

import { replaceTextVars } from './replaceTextVars'

describe('replaceTextVars', () => {
  it('replaces a single variable', () => {
    expect(replaceTextVars('Hello {name}', { '{name}': 'World' })).toBe('Hello World')
  })

  it('replaces multiple variables', () => {
    const result = replaceTextVars('{greeting} {name}!', {
      '{greeting}': 'Hi',
      '{name}': 'Nikita'
    })
    expect(result).toBe('Hi Nikita!')
  })

  it('replaces all occurrences of the same variable', () => {
    expect(replaceTextVars('{x} and {x}', { '{x}': 'A' })).toBe('A and A')
  })

  it('returns original text when no matches', () => {
    expect(replaceTextVars('Hello World', { '{name}': 'Test' })).toBe('Hello World')
  })

  it('handles empty string input', () => {
    expect(replaceTextVars('', { '{x}': 'A' })).toBe('')
  })

  it('handles empty vars object', () => {
    expect(replaceTextVars('Hello', {})).toBe('Hello')
  })
})
