import { z } from 'astro/zod'

export const pageEstimateSchema = z.number().int().positive()
export const pageEstimateMethodSchema = z.strictObject({
  en: z.string().trim().min(1),
  ru: z.string().trim().min(1)
})

export const bookPageEstimateSchema = z
  .object({
    language: z.enum(['en', 'ru']),
    pageEstimate: pageEstimateSchema.optional(),
    pageEstimateMethod: pageEstimateMethodSchema.optional()
  })
  .refine(book => (book.pageEstimate === undefined) === (book.pageEstimateMethod === undefined), {
    message: 'A page estimate and its localized method must be provided together',
    path: ['pageEstimateMethod']
  })

export type PageEstimateMethod = z.infer<typeof pageEstimateMethodSchema>
