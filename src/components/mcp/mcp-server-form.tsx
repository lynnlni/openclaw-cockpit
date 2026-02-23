'use client'

import { useState, useCallback } from 'react'
import type { MCPServerConfig } from '@/lib/config/types'
import { McpTransportConfig } from '@/components/mcp/mcp-transport-config'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface McpServerFormProps {
  name?: string
  config?: MCPServerConfig
  onSubmit: (name: string, config: MCPServerConfig) => void
  onCancel: () => void
  submitting?: boolean
}

const inputClass =
  'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

const INITIAL_CONFIG: MCPServerConfig = {
  transport: 'stdio',
  enabled: true,
  command: '',
  args: [],
  env: {},
}

export function McpServerForm({ name: initialName, config, onSubmit, onCancel, submitting }: McpServerFormProps) {
  const [name, setName] = useState(initialName ?? '')
  const [serverConfig, setServerConfig] = useState<MCPServerConfig>(config ?? INITIAL_CONFIG)

  const handleTransportChange = useCallback((transport: MCPServerConfig['transport']) => {
    const base = { transport, enabled: serverConfig.enabled }
    if (transport === 'stdio') {
      setServerConfig({ ...base, command: '', args: [], env: {} })
    } else {
      setServerConfig({ ...base, url: '', headers: {} })
    }
  }, [serverConfig.enabled])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (name.trim()) {
        onSubmit(name.trim(), serverConfig)
      }
    },
    [name, serverConfig, onSubmit]
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          服务名称 <span className="text-destructive">*</span>
        </label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="my-mcp-server"
          disabled={!!initialName}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">传输类型</label>
        <div className="flex gap-2">
          {(['stdio', 'http', 'sse'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTransportChange(t)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                serverConfig.transport === t
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <McpTransportConfig config={serverConfig} onChange={setServerConfig} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={submitting || !name.trim()}>
          {submitting ? '保存中...' : initialName ? '更新' : '添加'}
        </Button>
      </div>
    </form>
  )
}
