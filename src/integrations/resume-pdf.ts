import type { AstroIntegration } from 'astro'
import type { AddressInfo } from 'node:net'

import { mkdir, readFile, stat } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { createRequire } from 'node:module'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { supportedLocales } from '../app/i18n'
import { RESUME_FILENAMES_BY_LOCALE } from '../components/resume/constants'

const MIME_TYPES: Record<string, string> = {
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

function startServer(root: string): Promise<{ port: number; server: Server }> {
  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      let filePath = join(root, new URL(req.url!, 'http://localhost').pathname)

      try {
        const fileStat = await stat(filePath)
        if (fileStat.isDirectory()) filePath = join(filePath, 'index.html')
      } catch {}

      try {
        const content = await readFile(filePath)
        res.writeHead(200, { 'Content-Type': MIME_TYPES[extname(filePath)] || 'application/octet-stream' })
        res.end(content)
      } catch {
        res.writeHead(404)
        res.end()
      }
    })

    server.on('error', reject)
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo
      resolve({ port, server })
    })
  })
}

export default function resumePdf(): AstroIntegration {
  return {
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        if (process.env.TESTING) {
          logger.info('Skipping PDF generation in test mode')
          return
        }

        const distDir = fileURLToPath(dir)
        const { port, server } = await startServer(distDir)

        try {
          // Lazy require: Playwright is only installed in build environments, not during tests
          const nodeRequire = createRequire(import.meta.url)
          const { chromium } = nodeRequire('@playwright/test')
          const browser = await chromium.launch()

          try {
            const filesDir = join(distDir, 'files')
            await mkdir(filesDir, { recursive: true })

            for (const locale of supportedLocales) {
              const filename = RESUME_FILENAMES_BY_LOCALE[locale]
              const page = await browser.newPage()
              const response = await page.goto(`http://localhost:${port}/${locale}/resume/`, {
                waitUntil: 'networkidle'
              })
              if (!response?.ok()) {
                throw new Error(`Failed to load /${locale}/resume/ (status ${response?.status() ?? 'unknown'})`)
              }
              await page.pdf({
                format: 'A4',
                path: join(filesDir, `${filename}.pdf`),
                printBackground: true
              })
              await page.close()
              logger.info(`Generated ${filename}.pdf`)
            }
          } finally {
            await browser.close()
          }
        } finally {
          server.close()
        }
      }
    },
    name: 'resume-pdf'
  }
}
