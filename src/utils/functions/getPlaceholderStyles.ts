import fs from 'node:fs/promises'
import sharp from 'sharp'

/**
 * @param absoluteImagePath It's not possible to use Astro's ImageMetadata just importing the image because it contains psocessed src name which isn't available diring the build time yet
 */
export const getPlaceholderStyles = async (
  absoluteImagePath: string,
  size = 16,
  blur = 4,
  quality = 40
): Promise<string> => {
  const imageBuffer = await fs.readFile(absoluteImagePath)
  const img = sharp(imageBuffer)

  const { height, width } = await img.metadata()

  const smallestSide = Math.min(width!, height!)
  const factor = size / smallestSide

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

  return `background-image: url(${dataURI}); background-size: cover; background-position: center;`
}
