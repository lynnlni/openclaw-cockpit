'use client'

import type { MCPServerConfig } from '@/lib/config/types'
import { McpServerCard } from '@/components/mcp/mcp-server-card'
import { Plug } from 'lucide-react'

interface McpServerListProps {
  servers: Record<string, MCPServerConfig>
  onEdit: (name: string, config: MCPServerConfig) => void
  onDelete: (name: string) => void
  onToggle: (name: string, enabled: boolean) => void
}

export function McpServerList({ servers, onEdit, onDelete, onToggle }: McpServerListProps) {
  const entries = Object.entries(servers)

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12">
        <Plug className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">暂无 MCP 服务</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {entries.map(([name, config]) => (
        <McpServerCard
          key={name}
          name={name}
          config={config}
          onEdit={() => onEdit(name, config)}
          onDelete={() => onDelete(name)}
          onToggle={(enabled) => onToggle(name, enabled)}
        />
      ))}
    </div>
  )
}
