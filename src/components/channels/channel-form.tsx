'use client'

import { useState, useCallback } from 'react'
import type { ChannelConfig } from '@/lib/config/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChannelFormProps {
  channel?: ChannelConfig
  onSubmit: (channel: ChannelConfig) => void
  onCancel: () => void
  submitting?: boolean
}

const inputClass =
  'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const CHANNEL_TYPES = ['telegram', 'whatsapp', 'discord', 'slack', 'wechat'] as const

interface TelegramFields {
  botToken: string
  dmPolicy: string
  allowFrom: string
}

interface WhatsAppFields {
  phoneNumber: string
}

export function ChannelForm({ channel, onSubmit, onCancel, submitting }: ChannelFormProps) {
  const [type, setType] = useState(channel?.type ?? 'telegram')
  const [enabled, setEnabled] = useState(channel?.enabled ?? true)
  const [telegramFields, setTelegramFields] = useState<TelegramFields>({
    botToken: (channel?.botToken as string) ?? '',
    dmPolicy: (channel?.dmPolicy as string) ?? 'allow',
    allowFrom: (channel?.allowFrom as string) ?? '',
  })
  const [whatsappFields, setWhatsappFields] = useState<WhatsAppFields>({
    phoneNumber: (channel?.phoneNumber as string) ?? '',
  })
  const [genericFields, setGenericFields] = useState<Record<string, string>>({})

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      let config: ChannelConfig = { type, enabled }

      if (type === 'telegram') {
        config = { ...config, ...telegramFields }
      } else if (type === 'whatsapp') {
        config = { ...config, ...whatsappFields }
      } else {
        config = { ...config, ...genericFields }
      }

      onSubmit(config)
    },
    [type, enabled, telegramFields, whatsappFields, genericFields, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">渠道类型</label>
        <div className="flex flex-wrap gap-2">
          {CHANNEL_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm capitalize transition-colors',
                type === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {type === 'telegram' && (
        <>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Bot Token</label>
            <input
              className={inputClass}
              type="password"
              value={telegramFields.botToken}
              onChange={(e) =>
                setTelegramFields((prev) => ({ ...prev, botToken: e.target.value }))
              }
              placeholder="123456:ABC-DEF..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">DM 策略</label>
            <select
              className={inputClass}
              value={telegramFields.dmPolicy}
              onChange={(e) =>
                setTelegramFields((prev) => ({ ...prev, dmPolicy: e.target.value }))
              }
            >
              <option value="allow">允许</option>
              <option value="deny">拒绝</option>
              <option value="whitelist">白名单</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">允许列表</label>
            <input
              className={inputClass}
              value={telegramFields.allowFrom}
              onChange={(e) =>
                setTelegramFields((prev) => ({ ...prev, allowFrom: e.target.value }))
              }
              placeholder="用户ID，逗号分隔"
            />
          </div>
        </>
      )}

      {type === 'whatsapp' && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">手机号</label>
          <input
            className={inputClass}
            value={whatsappFields.phoneNumber}
            onChange={(e) =>
              setWhatsappFields((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
            placeholder="+86..."
            required
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground">启用</label>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((prev) => !prev)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            enabled ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? '保存中...' : channel ? '更新' : '添加'}
        </Button>
      </div>
    </form>
  )
}
