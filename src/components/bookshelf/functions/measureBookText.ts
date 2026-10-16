const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’\-‐‑][\p{L}\p{N}]+)*/gu

export const measureBookText = (text: string) => {
  const normalized = text.normalize('NFC').replace(/\s+/gu, ' ').trim()
  return {
    charactersWithNormalizedSpaces: Array.from(normalized).length,
    charactersWithoutWhitespace: Array.from(normalized.replace(/\s/gu, '')).length,
    words: normalized.match(WORD_PATTERN)?.length ?? 0
  }
}
