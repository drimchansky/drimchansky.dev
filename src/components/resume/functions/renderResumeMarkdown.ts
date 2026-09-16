import type { CollectionEntry } from 'astro:content'

import type { Locale } from '@/app/i18n'

import { t } from '@/app/i18n'
import { siteInfo } from '@/shared/site-info'

import { RESUME_FILENAMES_BY_LOCALE } from '../constants'
import { getTotalDurationText } from './getTotalDurationText'

export type ResumePosition = Pick<CollectionEntry<'resume'>, 'body' | 'data'>

export type RenderResumeMarkdownOptions = {
  education?: string
  locale: Locale
  positions: ResumePosition[]
  siteOrigin: string
  skills?: string
  summary?: string
}

const formatMonth = (date: Date, locale: Locale) =>
  date.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC', year: 'numeric' })

const renderPosition = ({ body, data }: ResumePosition, locale: Locale) => {
  const { company, companyLink, dateEnd, dateStart, location, position } = data
  const period = `${formatMonth(dateStart, locale)} – ${dateEnd ? formatMonth(dateEnd, locale) : t(locale, 'present')}`
  const duration = getTotalDurationText(dateStart, dateEnd, locale)

  return [
    `### ${position}, [${company}](${companyLink})`,
    `${period} (${duration}) · ${location.country} · ${t(locale, location.type)}`,
    body?.trim()
  ]
    .filter(Boolean)
    .join('\n\n')
}

export const renderResumeMarkdown = ({
  education,
  locale,
  positions,
  siteOrigin,
  skills,
  summary
}: RenderResumeMarkdownOptions) => {
  const contacts = siteInfo.socialLinks
    .filter(({ showOnResumePage, url }) => showOnResumePage && url)
    .map(({ content, name, url }) => `- ${name}: [${content}](${url})`)

  const experience = [...positions]
    .sort((a, b) => Number(b.data.dateStart) - Number(a.data.dateStart))
    .map(position => renderPosition(position, locale))

  return [
    `# ${t(locale, 'resume')} – ${t(locale, 'fullName')}`,
    `**${t(locale, 'fullName')}** — ${t(locale, 'occupation')}, ${t(locale, 'location')}`,
    [
      `- Canonical: ${siteOrigin}/${locale}/resume/`,
      `- PDF: ${siteOrigin}/files/${encodeURIComponent(RESUME_FILENAMES_BY_LOCALE[locale])}.pdf`,
      ...contacts
    ].join('\n'),
    `## ${t(locale, 'summary')}`,
    summary?.trim(),
    `## ${t(locale, 'workingExperience')}`,
    ...experience,
    `## ${t(locale, 'education')}`,
    education?.trim(),
    `## ${t(locale, 'skillsAndLanguages')}`,
    skills?.trim()
  ]
    .filter(Boolean)
    .join('\n\n')
}
