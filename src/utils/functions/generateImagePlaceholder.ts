import type { ImageMetadata } from 'astro'

import sharp from 'sharp'

/**
 *
 * @param imageMetadata Astro ImageMetadata
 * @param baseUrl The base URL of the site
 * @param target Size of the placeholder (px)
 * @param blur Gaussian-blur radius
 * @param quality Image quality for Sharp
 * @returns Image placeholder (base64)
 */
export const generateImagePlaceholder = async (
  imageMetadata: ImageMetadata,
  baseUrl: string,
  target = 64,
  blur = 4,
  quality = 90
) => {
  // The /@fs/ replacement is mainly for Vite dev server scenarios.
  const cleanedSrc = imageMetadata.src.replace(/^\/@fs/, '').replace(/\?.*$/, '')

  // Ensure cleanedSrc is treated as a path segment of the URL
  const imagePath = cleanedSrc.startsWith('/') ? cleanedSrc : `/${cleanedSrc}`
  const absoluteImageUrl = new URL(imagePath, baseUrl).href

  let srcBuffer: Buffer

  try {
    const response = await fetch(absoluteImageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image ${absoluteImageUrl}: ${response.statusText} (status: ${response.status})`)
    }
    const arrayBuffer = await response.arrayBuffer()
    srcBuffer = Buffer.from(arrayBuffer)
  } catch (error) {
    console.error(
      `Error fetching image for placeholder: ${absoluteImageUrl}. Original src: ${imageMetadata.src}`,
      error
    )

    throw new Error(
      `Could not load image from ${absoluteImageUrl} to generate placeholder. Original src: ${imageMetadata.src}. Error: ${(error as Error).message}`
    )
  }

  const img = sharp(srcBuffer)

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
