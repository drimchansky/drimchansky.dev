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

const booksCollection = defineCollection({
  loader: glob({
    base: './src/content/books',
    pattern: '**/*.md'
  }),
  schema: z.object({
    author: z.object({ en: z.string(), ru: z.string() }),
    cover: z.string(),
    dateFinished: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    fiction: z.boolean(),
    isTestOnly: z.boolean().optional(),
    language: z.enum(['en', 'ru']),
    rating: z.number().min(0.5).max(5).nullable(),
    skipped: z.boolean().optional(),
    title: z.object({ en: z.string(), ru: z.string() })
  })
})

export const collections = {
  books: booksCollection,
  general: generalCollection,
  notes: notesCollection,
  resume: resumeCollection
}
