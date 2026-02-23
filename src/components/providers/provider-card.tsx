import type { ProviderConfig } from '@/lib/config/types'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'

interface ProviderCardProps {
  providerKey: string
  config: ProviderConfig
  onEdit: () => void
  onDelete: () => void
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return '****'
  return `${key.slice(0, 3)}...${key.slice(-4)}`
}

export function ProviderCard({ providerKey, config, onEdit, onDelete }: ProviderCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium text-foreground capitalize">{providerKey}</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon-xs" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>API Key:</span>
          <span className="font-mono">{maskApiKey(config.apiKey)}</span>
        </div>
        {config.baseUrl && (
          <div className="flex items-center gap-2">
            <span>Base URL:</span>
            <span className="font-mono truncate">{config.baseUrl}</span>
          </div>
        )}
        {config.apiType && (
          <div className="flex items-center gap-2">
            <span>类型:</span>
            <span>{config.apiType}</span>
          </div>
        )}
        {config.models && config.models.length > 0 && (
          <div className="flex items-center gap-2">
            <span>模型:</span>
            <span className="truncate">{config.models.join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
