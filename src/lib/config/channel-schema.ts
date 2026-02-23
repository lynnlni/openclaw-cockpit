import { z } from 'zod'

export const baseChannelSchema = z.object({
  type: z.string().min(1),
  enabled: z.boolean(),
})

export const telegramChannelSchema = baseChannelSchema.extend({
  type: z.literal('telegram'),
  botToken: z.string().min(1, 'Bot token is required'),
  dmPolicy: z.enum(['allow', 'deny', 'allowlist']).optional(),
  allowFrom: z.array(z.string()).optional(),
})

export const whatsappChannelSchema = baseChannelSchema.extend({
  type: z.literal('whatsapp'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  accountSid: z.string().optional(),
  authToken: z.string().optional(),
})

export const discordChannelSchema = baseChannelSchema.extend({
  type: z.literal('discord'),
  botToken: z.string().min(1, 'Bot token is required'),
  guildId: z.string().optional(),
})

export const slackChannelSchema = baseChannelSchema.extend({
  type: z.literal('slack'),
  botToken: z.string().min(1, 'Bot token is required'),
  appToken: z.string().optional(),
})

export const channelSchema = z.discriminatedUnion('type', [
  telegramChannelSchema,
  whatsappChannelSchema,
  discordChannelSchema,
  slackChannelSchema,
])

export type ValidatedChannel = z.infer<typeof channelSchema>
