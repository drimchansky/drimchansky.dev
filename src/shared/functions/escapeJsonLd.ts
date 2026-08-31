// set:html injects the result unescaped, and a </script sequence inside any value would close the
// block early. Escaping every < prevents that; JSON.stringify emits < only inside string literals,
// so the escaped form always parses back to <.
export const escapeJsonLd = (value: Record<string, unknown>): string => {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
