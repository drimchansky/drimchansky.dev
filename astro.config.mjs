import mdx from '@astrojs/mdx'
import partytown from '@astrojs/partytown'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'
import dotenv from 'dotenv'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeSlug from 'rehype-slug'

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
      prefixDefaultLocale: true
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
    partytown({
      config: {
        forward: ['dataLayer.push']
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
    })
  ],
  site: process.env.SITE_URL
})
