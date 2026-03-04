import { z } from 'zod'

const hostnameRegex = /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z0-9-]{1,63})*$/
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/

const hostValidator = z.string().min(1).refine(
  (val) => hostnameRegex.test(val) || ipv4Regex.test(val),
  { message: 'Must be a valid hostname or IPv4 address' },
)

// Accept either a valid host or empty string (empty treated as absent for push machines)
const optionalHostValidator = z.string().refine(
  (val) => val === '' || hostnameRegex.test(val) || ipv4Regex.test(val),
  { message: 'Must be a valid hostname or IPv4 address' },
).transform((val) => val === '' ? undefined : val).optional()

export const createMachineSchema = z
  .object({
    name: z.string().min(1).max(255),
    connectionType: z.enum(['ssh', 'push']).default('ssh'),
    host: optionalHostValidator,
    port: z.number().int().min(1).max(65535).default(22),
    username: z.string().min(1).max(255).optional().transform((v) => v === '' ? undefined : v),
    authType: z.enum(['password', 'privateKey']).optional(),
    password: z.string().optional(),
    privateKeyPath: z.string().optional(),
    passphrase: z.string().optional(),
    pushRetainDays: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(7),
    ]).optional(),
    dashboardUrl: z.string().url('请输入有效的 URL，例如 http://192.168.1.10:3000').or(z.literal('')).optional()
      .transform((v) => (v === '' ? undefined : v)),
    pushCronSchedule: z.string().optional()
      .transform((v) => v === '' ? undefined : v),
    openclawPath: z.string().default('~/.openclaw'),
  })
  .superRefine((data, ctx) => {
    if (data.connectionType === 'ssh' || data.connectionType === undefined) {
      if (!data.host) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Host is required for SSH connections', path: ['host'] })
      }
      if (!data.username) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Username is required for SSH connections', path: ['username'] })
      }
      if (!data.authType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Auth type is required for SSH connections', path: ['authType'] })
      }
    }
  })

export const updateMachineSchema = z
  .object({
    name: z.string().min(1).max(255).optional(),
    connectionType: z.enum(['ssh', 'push']).optional(),
    host: optionalHostValidator,
    port: z.number().int().min(1).max(65535).optional(),
    username: z.string().min(1).max(255).optional().transform((v) => v === '' ? undefined : v),
    authType: z.enum(['password', 'privateKey']).optional(),
    password: z.string().optional(),
    privateKeyPath: z.string().optional(),
    passphrase: z.string().optional(),
    pushRetainDays: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(7),
    ]).optional(),
    dashboardUrl: z.string().url('请输入有效的 URL，例如 http://192.168.1.10:3000').or(z.literal('')).optional()
      .transform((v) => (v === '' ? undefined : v)),
    pushCronSchedule: z.string().optional()
      .transform((v) => v === '' ? undefined : v),
    openclawPath: z.string().optional(),
  })

export type CreateMachineInput = z.infer<typeof createMachineSchema>
export type UpdateMachineInput = z.infer<typeof updateMachineSchema>
