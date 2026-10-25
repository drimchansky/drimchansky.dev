const ATTRIBUTE_PATTERN = /\s([^\s=/>]+)\s*=\s*(?:"[^"]*"|'[^']*')/g

export type IconPath = {
  d: string
  fill: string
}

export type IconSource = {
  bounds: number[]
  paths: IconPath[]
  viewBox: string
}

export const parseIconSource = (source: string): IconSource => {
  if (source.includes('<!--')) {
    throw new Error('mark.svg must not contain comments')
  }

  const elementNames = new Set([...source.matchAll(/<([^\s/>!?]+)/g)].map(([, name]) => name))
  const unsupportedElements = [...elementNames].filter(name => name !== 'svg' && name !== 'path')
  if (unsupportedElements.length > 0) {
    throw new Error(`mark.svg may only contain svg and path elements; found ${unsupportedElements.join(', ')}`)
  }

  const rootElement = source.match(/<svg\b[^>]*>/)?.[0]
  if (!rootElement || source.match(/<svg\b/g)?.length !== 1) {
    throw new Error('mark.svg must contain exactly one svg element')
  }
  const unsupportedRootAttributes = parseAttributeNames('svg', rootElement).filter(
    name => name !== 'xmlns' && name !== 'viewBox'
  )
  if (unsupportedRootAttributes.length > 0) {
    throw new Error(
      `The svg element in mark.svg may only have xmlns and viewBox attributes; found ${unsupportedRootAttributes.join(', ')}`
    )
  }

  const pathElements = [...source.matchAll(/<path\b[^>]*>/g)]
  if (pathElements.length === 0) {
    throw new Error('mark.svg must contain at least one path')
  }

  const paths = pathElements.map(([element]) => {
    const unsupportedAttributes = parseAttributeNames('path', element).filter(name => name !== 'd' && name !== 'fill')
    if (unsupportedAttributes.length > 0) {
      throw new Error(
        `Each path in mark.svg may only have d and fill attributes; found ${unsupportedAttributes.join(', ')}`
      )
    }
    const d = element
      .match(/\bd="([^"]+)"/)?.[1]
      .replace(/\s+/g, ' ')
      .trim()
    const fill = element.match(/\bfill="(#[\da-f]{6})"/i)?.[1]
    if (!d || !fill) {
      throw new Error('Each path in mark.svg must provide a d attribute and a hex fill')
    }
    if (!/^[\d\s,.+\-eEMmZzLlHhVvCcSsQqTtAa]+$/.test(d)) {
      throw new Error('Each path d in mark.svg may only contain path data')
    }
    return { d, fill }
  })

  const viewBox = rootElement.match(/\bviewBox="([^"]+)"/)?.[1]
  if (!viewBox) {
    throw new Error('mark.svg must provide a viewBox')
  }
  const bounds = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number)
  const [, , width, height] = bounds
  if (bounds.length !== 4 || !bounds.every(Number.isFinite) || width <= 0 || height !== width) {
    throw new Error('mark.svg must have a finite square viewBox with positive dimensions')
  }

  return { bounds, paths, viewBox }
}

function parseAttributeNames(name: 'path' | 'svg', tag: string) {
  const unparsed = tag.slice(`<${name}`.length).replace(ATTRIBUTE_PATTERN, '').replace(/\/?>$/, '').trim()
  if (unparsed) {
    throw new Error(`Each ${name} attribute in mark.svg must have a quoted value; found ${unparsed}`)
  }
  return [...tag.matchAll(ATTRIBUTE_PATTERN)].map(([, attribute]) => attribute)
}
