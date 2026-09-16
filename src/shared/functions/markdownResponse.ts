export const MARKDOWN_CONTENT_TYPE = 'text/markdown; charset=utf-8'

export const markdownResponse = (body: string) =>
  new Response(body.endsWith('\n') ? body : `${body}\n`, {
    headers: { 'Content-Type': MARKDOWN_CONTENT_TYPE }
  })
