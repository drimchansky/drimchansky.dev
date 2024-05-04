import sitemap from '@astrojs/sitemap'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'
import dotenv from 'dotenv'

dotenv.config()

// https://astro.build/config
export default defineConfig({
  build: {
    inlineStylesheets: 'never'
  },
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
  integrations: [icon(), sitemap()],
  site: process.env.SITE_URL
})
