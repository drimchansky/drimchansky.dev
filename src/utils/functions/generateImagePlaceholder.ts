import fs from 'node:fs/promises'
import sharp from 'sharp'

/**
 * @param imageMetadata Astro ImageMetadata
 * @param baseUrl The base URL of the site
 * @param target Size of the placeholder (px)
 * @param blur Gaussian-blur radius
 * @param quality Image quality for Sharp
 * @returns Image placeholder (base64)
 */
export const generateImagePlaceholder = async (absoluteImagePath: string, target = 16, blur = 4, quality = 40) => {
  const imageBuffer = await fs.readFile(absoluteImagePath)
  const img = sharp(imageBuffer)

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
