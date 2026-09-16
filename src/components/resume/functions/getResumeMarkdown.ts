import { getCollection, getEntry } from 'astro:content'

import type { Locale } from '@/app/i18n'

import { renderResumeMarkdown } from './renderResumeMarkdown'

export const getResumeMarkdown = async (locale: Locale, siteOrigin: string) => {
  const [summary, education, skills] = await Promise.all(
    ['summary', 'education', 'skills'].map(id => getEntry('general', `${locale}/${id}`))
  )
  const positions = await getCollection('resume', ({ id }) => id.startsWith(`${locale}/`))

  return renderResumeMarkdown({
    education: education?.body,
    locale,
    positions,
    siteOrigin,
    skills: skills?.body,
    summary: summary?.body
  })
}
