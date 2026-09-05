import type { CollectionEntry } from 'astro:content'

export const getNoteSlug = (id: CollectionEntry<'notes'>['id']) => id.split('/').slice(1).join('/')
