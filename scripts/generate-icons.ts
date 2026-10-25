import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

import { parseIconSource } from './icon-source.ts'

type IconImage = {
  png: Buffer
  size: number
}

type IconRender = {
  opaque: boolean
  size: number
}

type PngIcon = IconRender & {
  file: string
  purpose?: 'any' | 'maskable'
}

const SOURCE = 'src/shared/assets/brand/mark.svg'
const GENERATED_NOTICE = `Generated from ${SOURCE} by \`pnpm icons\`. Do not edit.`
const ROOT_PATH = resolve(import.meta.dirname, '..')
const PUBLIC_PATH = resolve(ROOT_PATH, 'public')
const MODULE_PATH = resolve(ROOT_PATH, 'src/shared/site-icons.ts')
const PNG_ICONS: readonly PngIcon[] = [
  { file: 'apple-touch-icon.png', opaque: true, size: 180 },
  { file: 'icon-192.png', opaque: false, purpose: 'any', size: 192 },
  { file: 'icon-512.png', opaque: false, purpose: 'any', size: 512 },
  { file: 'icon-maskable-512.png', opaque: true, purpose: 'maskable', size: 512 }
]
const ICO_SIZES = [16, 32, 48]
const ICO_HEADER_SIZE = 6
const ICO_ENTRY_SIZE = 16

const { bounds, paths, viewBox } = parseIconSource(readFileSync(resolve(ROOT_PATH, SOURCE), 'utf8'))
const pathMarkup = paths.map(({ d, fill }) => `  <path d="${d}" fill="${fill}" />`).join('\n')
// The tile colour also fills the opaque icons and tints the browser UI through theme-color.
const tileColor = paths[0].fill
const [minX, minY, width, height] = bounds

const publicFiles = new Map<string, Buffer | string>([
  [
    'favicon.ico',
    createIco(await Promise.all(ICO_SIZES.map(async size => ({ png: await renderPng({ opaque: false, size }), size }))))
  ],
  [
    'icon.svg',
    `<!-- ${GENERATED_NOTICE} -->\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n${pathMarkup}\n</svg>\n`
  ],
  ...(await Promise.all(PNG_ICONS.map(async icon => [icon.file, await renderPng(icon)] as const)))
])
for (const [file, content] of publicFiles) {
  writeFileSync(resolve(PUBLIC_PATH, file), content)
}

const manifest = {
  icons: PNG_ICONS.flatMap(({ file, purpose, size }) =>
    purpose ? [{ purpose, sizes: `${size}x${size}`, src: versionedUrl(file), type: 'image/png' }] : []
  )
}
writeFileSync(resolve(PUBLIC_PATH, 'manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`)

writeFileSync(
  MODULE_PATH,
  `// ${GENERATED_NOTICE}
export const SITE_ICON_URLS = {
  appleTouchIcon: '${versionedUrl('apple-touch-icon.png')}',
  favicon: '${versionedUrl('favicon.ico')}',
  svg: '${versionedUrl('icon.svg')}'
}

export const THEME_COLOR = '${tileColor}'
`
)

// Browsers keep a cached icon for an unchanged URL, so a content hash makes them fetch a changed one.
function versionedUrl(file: string) {
  const content = publicFiles.get(file)
  if (content === undefined) {
    throw new Error(`No generated public file is named ${file}`)
  }
  return `/${file}?v=${createHash('sha256').update(content).digest('hex').slice(0, 8)}`
}

function renderPng({ opaque, size }: IconRender) {
  const background = opaque
    ? `  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${tileColor}" />\n`
    : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">
${background}${pathMarkup}
</svg>`
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()
}

function createIco(images: readonly IconImage[]) {
  const directory = Buffer.alloc(ICO_HEADER_SIZE + images.length * ICO_ENTRY_SIZE)
  directory.writeUInt16LE(1, 2)
  directory.writeUInt16LE(images.length, 4)
  let imageOffset = directory.length
  for (const [index, image] of images.entries()) {
    const entryOffset = ICO_HEADER_SIZE + index * ICO_ENTRY_SIZE
    directory.writeUInt8(image.size, entryOffset)
    directory.writeUInt8(image.size, entryOffset + 1)
    directory.writeUInt16LE(1, entryOffset + 4)
    directory.writeUInt16LE(32, entryOffset + 6)
    directory.writeUInt32LE(image.png.length, entryOffset + 8)
    directory.writeUInt32LE(imageOffset, entryOffset + 12)
    imageOffset += image.png.length
  }
  return Buffer.concat([directory, ...images.map(image => image.png)])
}
