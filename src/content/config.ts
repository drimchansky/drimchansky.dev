import { defineCollection, z } from 'astro:content'

const resumeCollection = defineCollection({
  schema: z.object({
    company: z.string(),
    companyLink: z.string(),
    dateEnd: z.date().optional(),
    dateStart: z.date(),
    isDevelopment: z.boolean().optional(),
    location: z.object({
      country: z.string(),
      type: z.enum(['on-site', 'remote', 'hybrid'])
    }),
    position: z.string()
  })
})

const generalCollection = defineCollection({})

const notesCollection = defineCollection({
  schema: z.object({
    description: z.string().optional(),
    isDraft: z.boolean().optional(),
    isTestNote: z.boolean().optional(),
    isUntranslated: z.boolean().optional(),
    lastModified: z.date().optional(),
    publishingDate: z.date(),
    title: z.string()
  }),
  type: 'content'
})

export const collections = {
  general: generalCollection,
  notes: notesCollection,
  resume: resumeCollection
}
