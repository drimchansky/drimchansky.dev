import type { ImageMetadata } from 'astro'

import fs from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const getVercelImageBuffer = async (imageMetadata: ImageMetadata, baseUrl: string) => {
  const src = imageMetadata.src
  const imagePath = src.startsWith('/') ? src : `/${src}`
  const absoluteImageUrl = new URL(imagePath, baseUrl).href

  const response = await fetch(absoluteImageUrl)

  return Buffer.from(await response.arrayBuffer())
}

const getLocalImageBuffer = async (imagePath: string) => {
  const filePath = fileURLToPath(new URL(imagePath, import.meta.url))
  return await fs.readFile(imagePath)
}

/**
 * @param imageMetadata Astro ImageMetadata
 * @param baseUrl The base URL of the site
 * @param target Size of the placeholder (px)
 * @param blur Gaussian-blur radius
 * @param quality Image quality for Sharp
 * @returns Image placeholder (base64)
 */
export const generateImagePlaceholder = async (imagePath: string, target = 64, blur = 4, quality = 90) => {
  const isVercel = !!process.env.VERCEL

  const imageBuffer = await getLocalImageBuffer(imagePath)
  // ? await getVercelImageBuffer(imageMetadata, baseUrl)
  // : await getLocalImageBuffer(imageMetadata)

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
