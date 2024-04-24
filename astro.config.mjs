import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  build: {
    inlineStylesheets: 'never'
  },
  devToolbar: {
    enabled: false
  },
  site: 'https://drimchansky.dev',
  i18n: {
    defaultLocale: 'en',
    locales: ['ru', 'en'],
    routing: {
      prefixDefaultLocale: true
    }
  }
})
