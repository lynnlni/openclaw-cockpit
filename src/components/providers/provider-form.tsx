'use client'

import { useState, useCallback } from 'react'
import type { ProviderConfig } from '@/lib/config/types'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'

interface ProviderFormProps {
  providerKey?: string
  config?: ProviderConfig
  onSubmit: (key: string, config: ProviderConfig) => void
  onCancel: () => void
  submitting?: boolean
}

const inputClass =
  'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

interface FormState {
  key: string
  apiKey: string
  baseUrl: string
  apiType: string
  models: string
}

export function ProviderForm({ providerKey, config, onSubmit, onCancel, submitting }: ProviderFormProps) {
  const [formState, setFormState] = useState<FormState>({
    key: providerKey ?? '',
    apiKey: config?.apiKey ?? '',
    baseUrl: config?.baseUrl ?? '',
    apiType: config?.apiType ?? '',
    models: config?.models?.join(', ') ?? '',
  })
  const [showKey, setShowKey] = useState(false)

  const handleChange = useCallback((field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const modelList = formState.models
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean)

      const providerConfig: ProviderConfig = {
        apiKey: formState.apiKey,
        ...(formState.baseUrl ? { baseUrl: formState.baseUrl } : {}),
        ...(formState.apiType ? { apiType: formState.apiType } : {}),
        ...(modelList.length > 0 ? { models: modelList } : {}),
      }

      onSubmit(formState.key, providerConfig)
    },
    [formState, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          标识 <span className="text-destructive">*</span>
        </label>
        <input
          className={inputClass}
          value={formState.key}
          onChange={(e) => handleChange('key', e.target.value)}
          placeholder="openai"
          disabled={!!providerKey}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          API Key <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-1">
          <input
            className={inputClass}
            type={showKey ? 'text' : 'password'}
            value={formState.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            placeholder="sk-..."
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowKey((prev) => !prev)}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Base URL</label>
        <input
          className={inputClass}
          value={formState.baseUrl}
          onChange={(e) => handleChange('baseUrl', e.target.value)}
          placeholder="https://api.openai.com/v1"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">API 类型</label>
        <input
          className={inputClass}
          value={formState.apiType}
          onChange={(e) => handleChange('apiType', e.target.value)}
          placeholder="openai"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">模型列表</label>
        <input
          className={inputClass}
          value={formState.models}
          onChange={(e) => handleChange('models', e.target.value)}
          placeholder="gpt-4o, gpt-4o-mini"
        />
        <p className="text-xs text-muted-foreground">多个模型用逗号分隔</p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? '保存中...' : providerKey ? '更新' : '添加'}
        </Button>
      </div>
    </form>
  )
}
