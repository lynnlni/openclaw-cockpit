'use client'

import type { MCPServerConfig } from '@/lib/config/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { McpTestButton } from '@/components/mcp/mcp-test-button'
import { Pencil, Trash2 } from 'lucide-react'

interface McpServerCardProps {
  name: string
  config: MCPServerConfig
  onEdit: () => void
  onDelete: () => void
  onToggle: (enabled: boolean) => void
}

const transportLabels: Record<string, string> = {
  stdio: 'STDIO',
  http: 'HTTP',
  sse: 'SSE',
}

export function McpServerCard({ name, config, onEdit, onDelete, onToggle }: McpServerCardProps) {
  const isEnabled = config.enabled !== false

  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">{name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {transportLabels[config.transport] ?? config.transport}
            </Badge>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={() => onToggle(!isEnabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        {config.transport === 'stdio' && config.command && (
          <span className="font-mono">{config.command}</span>
        )}
        {(config.transport === 'http' || config.transport === 'sse') && config.url && (
          <span className="font-mono">{config.url}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
        <McpTestButton name={name} />
        <Button variant="ghost" size="icon-xs" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
