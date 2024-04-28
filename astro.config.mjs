import { defineConfig } from 'astro/config'
import icon from 'astro-icon'

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
  integrations: [icon()]
})
