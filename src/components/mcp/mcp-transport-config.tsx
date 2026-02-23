'use client'

import { useState, useCallback } from 'react'
import type { MCPServerConfig } from '@/lib/config/types'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'

interface McpTransportConfigProps {
  config: MCPServerConfig
  onChange: (config: MCPServerConfig) => void
}

const inputClass =
  'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export function McpTransportConfig({ config, onChange }: McpTransportConfigProps) {
  if (config.transport === 'stdio') {
    return <StdioConfig config={config} onChange={onChange} />
  }

  return <HttpConfig config={config} onChange={onChange} />
}

function StdioConfig({
  config,
  onChange,
}: {
  config: MCPServerConfig
  onChange: (c: MCPServerConfig) => void
}) {
  const handleAddArg = useCallback(() => {
    onChange({ ...config, args: [...(config.args ?? []), ''] })
  }, [config, onChange])

  const handleArgChange = useCallback(
    (index: number, value: string) => {
      const newArgs = (config.args ?? []).map((a, i) => (i === index ? value : a))
      onChange({ ...config, args: newArgs })
    },
    [config, onChange]
  )

  const handleRemoveArg = useCallback(
    (index: number) => {
      onChange({ ...config, args: (config.args ?? []).filter((_, i) => i !== index) })
    },
    [config, onChange]
  )

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">命令</label>
        <input
          className={inputClass}
          value={config.command ?? ''}
          onChange={(e) => onChange({ ...config, command: e.target.value })}
          placeholder="npx"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">参数</label>
          <Button type="button" variant="ghost" size="icon-xs" onClick={handleAddArg}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="space-y-1">
          {(config.args ?? []).map((arg, i) => (
            <div key={i} className="flex gap-1">
              <input
                className={inputClass}
                value={arg}
                onChange={(e) => handleArgChange(i, e.target.value)}
                placeholder={`参数 ${i + 1}`}
              />
              <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRemoveArg(i)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <KeyValueEditor
        label="环境变量"
        entries={config.env ?? {}}
        onChange={(env) => onChange({ ...config, env })}
      />
    </div>
  )
}

function HttpConfig({
  config,
  onChange,
}: {
  config: MCPServerConfig
  onChange: (c: MCPServerConfig) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">URL</label>
        <input
          className={inputClass}
          value={config.url ?? ''}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
          placeholder="https://example.com/mcp"
        />
      </div>

      <KeyValueEditor
        label="请求头"
        entries={config.headers ?? {}}
        onChange={(headers) => onChange({ ...config, headers })}
      />
    </div>
  )
}

function KeyValueEditor({
  label,
  entries,
  onChange,
}: {
  label: string
  entries: Record<string, string>
  onChange: (entries: Record<string, string>) => void
}) {
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const pairs = Object.entries(entries)

  const handleAdd = useCallback(() => {
    if (newKey.trim()) {
      onChange({ ...entries, [newKey.trim()]: newValue })
      setNewKey('')
      setNewValue('')
    }
  }, [newKey, newValue, entries, onChange])

  const handleRemove = useCallback(
    (key: string) => {
      const next = { ...entries }
      delete next[key]
      onChange(next)
    },
    [entries, onChange]
  )

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="space-y-1">
        {pairs.map(([k, v]) => (
          <div key={k} className="flex items-center gap-1">
            <span className="w-32 truncate rounded-md bg-muted px-2 py-1.5 text-xs font-mono text-foreground">
              {k}
            </span>
            <span className="flex-1 truncate rounded-md bg-muted px-2 py-1.5 text-xs font-mono text-muted-foreground">
              {v}
            </span>
            <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleRemove(k)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          className={`${inputClass} w-32`}
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Key"
        />
        <input
          className={inputClass}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value"
        />
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
