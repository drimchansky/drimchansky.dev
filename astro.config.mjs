import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'
import dotenv from 'dotenv'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeSlug from 'rehype-slug'

import resumePdf from './src/integrations/resume-pdf'

dotenv.config({
  quiet: true
})

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['ru', 'en'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true
    }
  },
  integrations: [
    icon({
      iconDir: 'src/shared/assets/icons'
    }),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          ru: 'ru-RU'
        }
      }
    }),
    mdx({
      rehypePlugins: [
        rehypeSlug,
        [rehypeExternalLinks, { rel: ['noopener', 'noreferrer'], target: '_blank' }],
        [rehypeAutolinkHeadings, { behavior: 'append' }]
      ],
      shikiConfig: {
        theme: 'github-dark',
        wrap: true
      },
      syntaxHighlight: 'shiki'
    }),
    resumePdf()
  ],
  site: process.env.SITE_URL,
  vite: {
    plugins: [tailwindcss()]
  }
})
