import type { ImageMetadata } from 'astro'
import type { CollectionEntry } from 'astro:content'

import type { Locale } from '@/app/i18n'

import { renderNoteMarkdown } from './renderNoteMarkdown'

const assets = import.meta.glob<{ default: ImageMetadata }>('/src/components/notes/assets/*', { eager: true })

export const getNoteMarkdown = (locale: Locale, siteOrigin: string, note: CollectionEntry<'notes'>) =>
  renderNoteMarkdown({ locale, note, resolveAsset: projectPath => assets[projectPath]?.default.src, siteOrigin })
