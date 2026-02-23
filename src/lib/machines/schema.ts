import { z } from 'zod'

const hostnameRegex = /^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z0-9-]{1,63})*$/
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/

const hostValidator = z.string().min(1).refine(
  (val) => hostnameRegex.test(val) || ipv4Regex.test(val),
  { message: 'Must be a valid hostname or IPv4 address' },
)

export const createMachineSchema = z.object({
  name: z.string().min(1).max(255),
  host: hostValidator,
  port: z.number().int().min(1).max(65535).default(22),
  username: z.string().min(1).max(255),
  authType: z.enum(['password', 'privateKey']),
  password: z.string().optional(),
  privateKeyPath: z.string().optional(),
  passphrase: z.string().optional(),
  openclawPath: z.string().default('~/.openclaw'),
})

export const updateMachineSchema = createMachineSchema.partial()

export type CreateMachineInput = z.infer<typeof createMachineSchema>
export type UpdateMachineInput = z.infer<typeof updateMachineSchema>
