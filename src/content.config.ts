import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const resumeCollection = defineCollection({
  loader: glob({
    base: './src/content/resume',
    pattern: '**/*.md'
  }),
  schema: z.object({
    company: z.string(),
    companyLink: z.string(),
    dateEnd: z.date().optional(),
    dateStart: z.date(),
    location: z.object({
      country: z.string(),
      type: z.enum(['on-site', 'remote', 'hybrid'])
    }),
    position: z.string()
  })
})

const generalCollection = defineCollection({
  loader: glob({
    base: './src/content/general',
    pattern: '**/*.md'
  })
})

const notesCollection = defineCollection({
  loader: glob({
    base: './src/content/notes',
    pattern: '**/*.{md,mdx}'
  }),
  schema: z.object({
    description: z.string().optional(),
    isDraft: z.boolean().optional(),
    isTestOnly: z.boolean().optional(),
    isUntranslated: z.boolean().optional(),
    lastModified: z.date().optional(),
    publishingDate: z.date(),
    title: z.string()
  })
})

export const collections = {
  general: generalCollection,
  notes: notesCollection,
  resume: resumeCollection
}
