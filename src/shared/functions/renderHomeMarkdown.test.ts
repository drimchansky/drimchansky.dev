import { describe, expect, it } from 'vitest'

import { supportedLocales, t } from '@/app/i18n'
import { siteInfo } from '@/shared/site-info'

import { renderHomeMarkdown } from './renderHomeMarkdown'

describe('renderHomeMarkdown', () => {
  it.each(supportedLocales)('renders navigation, visible social links and other locales for %s', locale => {
    const origin = 'https://example.com'
    const result = renderHomeMarkdown(locale, origin)
    expect(result).toContain(`# ${t(locale, 'fullName')}\n\n`)
    expect(result).toContain(t(locale, 'intro'))
    expect(result).toContain(`- Canonical: ${origin}/${locale}/`)
    for (const { id, route } of siteInfo.navigation.filter(({ id }) => id !== 'home')) {
      expect(result).toContain(`- [${t(locale, id)}](${origin}/${locale}${route}.md)`)
    }
    for (const link of siteInfo.socialLinks) {
      if (link.showOnHomePage && link.url) expect(result).toContain(`- [${link.name}](${link.url})`)
      else expect(result).not.toContain(`- [${link.name}](`)
    }
    for (const other of supportedLocales.filter(other => other !== locale)) {
      expect(result).toContain(`- ${t(locale, 'toLocale')}: ${origin}/${other}/index.md`)
    }
    expect(result).not.toContain('undefined')
    expect(result).not.toContain('null')
  })
})
