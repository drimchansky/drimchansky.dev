import fs from 'node:fs/promises'
import sharp from 'sharp'

export const generateBase64ImagePlaceholder = async (absoluteImagePath: string, size = 16, blur = 4, quality = 40) => {
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

  return dataURI
}
