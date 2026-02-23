import { z } from 'zod'

export const machineIdSchema = z
  .string()
  .min(1, 'Machine ID is required')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Machine ID must be alphanumeric with hyphens or underscores'
  )

export const filePathSchema = z
  .string()
  .min(1, 'File path is required')
  .refine(
    (path) => !path.includes('..'),
    'File path must not contain ".." traversal'
  )

export const skillNameSchema = z
  .string()
  .min(1, 'Skill name is required')
  .regex(
    /^[a-zA-Z0-9-]+$/,
    'Skill name must be alphanumeric with hyphens'
  )

export const mcpServerNameSchema = z
  .string()
  .min(1, 'Server name is required')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Server name must be alphanumeric with hyphens or underscores'
  )

export const snapshotNameSchema = z
  .string()
  .min(1, 'Snapshot name is required')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Snapshot name must be alphanumeric with hyphens or underscores'
  )

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type ValidatedPagination = z.infer<typeof paginationSchema>
