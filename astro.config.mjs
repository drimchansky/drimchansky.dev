import partytown from '@astrojs/partytown'
import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'
import dotenv from 'dotenv'

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
    sitemap(),
    partytown({
      config: {
        forward: ['dataLayer.push']
      }
    })
  ],
  site: process.env.SITE_URL
})
