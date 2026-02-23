import { z } from 'zod'

export const stdioMcpSchema = z.object({
  transport: z.literal('stdio'),
  enabled: z.boolean().optional(),
  command: z.string().min(1, 'Command is required'),
  args: z.array(z.string()).optional(),
  env: z.record(z.string(), z.string()).optional(),
})

export const httpMcpSchema = z.object({
  transport: z.literal('http'),
  enabled: z.boolean().optional(),
  url: z.string().url('Valid URL is required'),
  headers: z.record(z.string(), z.string()).optional(),
})

export const sseMcpSchema = z.object({
  transport: z.literal('sse'),
  enabled: z.boolean().optional(),
  url: z.string().url('Valid URL is required'),
  headers: z.record(z.string(), z.string()).optional(),
})

export const mcpServerSchema = z.discriminatedUnion('transport', [
  stdioMcpSchema,
  httpMcpSchema,
  sseMcpSchema,
])

export const mcpServerFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Server name is required')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Name must be alphanumeric with hyphens or underscores'
    ),
  server: mcpServerSchema,
})

export type ValidatedMcpServer = z.infer<typeof mcpServerSchema>
export type ValidatedMcpServerForm = z.infer<typeof mcpServerFormSchema>
