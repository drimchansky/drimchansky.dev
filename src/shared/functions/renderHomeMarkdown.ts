import type { Locale } from '@/app/i18n'

import { supportedLocales, t } from '@/app/i18n'
import { requireMarkdownPath } from '@/shared/functions/requireMarkdownPath'
import { siteInfo } from '@/shared/site-info'

export const renderHomeMarkdown = (locale: Locale, siteOrigin: string) => {
  const otherLocales = supportedLocales.filter(other => other !== locale)

  const pages = siteInfo.navigation
    .filter(({ id }) => id !== 'home')
    .map(({ id, route }) => `- [${t(locale, id)}](${siteOrigin}${requireMarkdownPath(`/${locale}${route}/`)})`)

  const links = siteInfo.socialLinks
    .filter(({ showOnHomePage, url }) => showOnHomePage && url)
    .map(({ name, url }) => `- [${name}](${url})`)

  return [
    `# ${t(locale, 'fullName')}`,
    t(locale, 'intro'),
    [
      `- ${t(locale, 'occupation')}, ${t(locale, 'location')}`,
      `- Canonical: ${siteOrigin}/${locale}/`,
      ...otherLocales.map(other => `- ${t(locale, 'toLocale')}: ${siteOrigin}/${other}/index.md`)
    ].join('\n'),
    `## Pages\n\n${pages.join('\n')}`,
    `## Social links\n\n${links.join('\n')}`
  ].join('\n\n')
}
