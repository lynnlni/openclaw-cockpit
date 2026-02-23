'use client'

import type { ChannelConfig } from '@/lib/config/types'
import { ChannelCard } from '@/components/channels/channel-card'
import { Radio } from 'lucide-react'

interface ChannelListProps {
  channels: ChannelConfig[]
  onEdit: (index: number, channel: ChannelConfig) => void
  onDelete: (index: number) => void
  onToggle: (index: number, enabled: boolean) => void
}

export function ChannelList({ channels, onEdit, onDelete, onToggle }: ChannelListProps) {
  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12">
        <Radio className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">暂无渠道配置</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {channels.map((channel, index) => (
        <ChannelCard
          key={`${channel.type}-${index}`}
          channel={channel}
          onEdit={() => onEdit(index, channel)}
          onDelete={() => onDelete(index)}
          onToggle={(enabled) => onToggle(index, enabled)}
        />
      ))}
    </div>
  )
}
