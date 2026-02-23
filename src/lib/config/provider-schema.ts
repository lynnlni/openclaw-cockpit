import { z } from 'zod'

export const providerSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  baseUrl: z.string().url().optional(),
  apiType: z.string().optional(),
  models: z.array(z.string()).optional(),
})

export const modelsConfigSchema = z.object({
  primary: z.string().optional(),
  fallback: z.array(z.string()).optional(),
  providers: z.record(z.string(), providerSchema).optional(),
})

export type ValidatedProvider = z.infer<typeof providerSchema>
export type ValidatedModelsConfig = z.infer<typeof modelsConfigSchema>
