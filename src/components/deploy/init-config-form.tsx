'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'

interface InitConfigFormProps {
  machineId: string
  onComplete: () => void
}

interface FormState {
  provider: string
  apiKey: string
  model: string
}

const INITIAL_STATE: FormState = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o',
}

const inputClass =
  'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export function InitConfigForm({ machineId, onComplete }: InitConfigFormProps) {
  const [formState, setFormState] = useState<FormState>(INITIAL_STATE)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = useCallback(
    (field: keyof FormState, value: string) => {
      setFormState((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setSubmitting(true)
      try {
        const res = await fetch(`/api/instances/${machineId}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            models: {
              primary: formState.model,
              providers: {
                [formState.provider]: {
                  apiKey: formState.apiKey,
                },
              },
            },
          }),
        })
        if (res.ok) {
          onComplete()
        }
      } catch {
        // error handled by UI
      } finally {
        setSubmitting(false)
      }
    },
    [machineId, formState, onComplete]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">模型供应商</label>
        <select
          className={inputClass}
          value={formState.provider}
          onChange={(e) => handleChange('provider', e.target.value)}
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="deepseek">DeepSeek</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">API Key</label>
        <input
          className={inputClass}
          type="password"
          value={formState.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          placeholder="sk-..."
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">默认模型</label>
        <input
          className={inputClass}
          value={formState.model}
          onChange={(e) => handleChange('model', e.target.value)}
          placeholder="gpt-4o"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? '保存中...' : '保存配置'}
        </Button>
      </div>
    </form>
  )
}
