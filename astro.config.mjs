import mdx from '@astrojs/mdx'
import partytown from '@astrojs/partytown'
import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'
import dotenv from 'dotenv'
import rehypeExternalLinks from 'rehype-external-links'

dotenv.config()

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
    sitemap(),
    partytown({
      config: {
        forward: ['dataLayer.push']
      }
    }),
    mdx({
      rehypePlugins: [[rehypeExternalLinks, { rel: ['noopener', 'noreferrer'], target: '_blank' }]],
      shikiConfig: {
        theme: 'github-dark',
        wrap: true
      },
      syntaxHighlight: 'shiki'
    })
  ],
  site: process.env.SITE_URL
})
