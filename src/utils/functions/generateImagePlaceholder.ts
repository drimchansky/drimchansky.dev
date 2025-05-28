import type { ImageMetadata } from 'astro'

import fs from 'node:fs/promises'
import sharp from 'sharp'

/**
 *
 * @param imageMetadata Astro ImageMetadata
 * @param target Size of the placeholder (px)
 * @param blur Gaussian-blur radius
 * @param quality Image quality for Sharp
 * @returns Image placeholder (base64)
 */
export const generateImagePlaceholder = async (imageMetadata: ImageMetadata, target = 64, blur = 4, quality = 90) => {
  console.log('>>> imageMetadata', imageMetadata)
  const cleanedSrc = imageMetadata.src.replace(/^\/@fs/, '').replace(/\?.*$/, '')
  const src = await fs.readFile(cleanedSrc)
  const img = sharp(src)

  const { height, width } = await img.metadata()

  const smallestSide = Math.min(width!, height!)
  const factor = target / smallestSide

  const lqipBuffer = await img
    .resize({
      fit: 'inside',
      height: Math.round(height! * factor),
      width: Math.round(width! * factor)
    })
    .blur(blur)
    .toFormat('jpeg', {
      mozjpeg: true,
      progressive: true,
      quality
    })
    .toBuffer()

  const base64 = lqipBuffer.toString('base64')
  const dataURI = `data:image/jpeg;base64,${base64}`

  return dataURI
}
