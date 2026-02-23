import type { ChannelConfig } from '@/lib/config/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2 } from 'lucide-react'

interface ChannelCardProps {
  channel: ChannelConfig
  onEdit: () => void
  onDelete: () => void
  onToggle: (enabled: boolean) => void
}

export function ChannelCard({ channel, onEdit, onDelete, onToggle }: ChannelCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium capitalize text-foreground">{channel.type}</h3>
          <Badge variant={channel.enabled ? 'default' : 'secondary'} className="text-xs">
            {channel.enabled ? '启用' : '禁用'}
          </Badge>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={channel.enabled}
          onClick={() => onToggle(!channel.enabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            channel.enabled ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              channel.enabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-3">
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
