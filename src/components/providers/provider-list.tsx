'use client'

import type { ProviderConfig } from '@/lib/config/types'
import { ProviderCard } from '@/components/providers/provider-card'
import { Key } from 'lucide-react'

interface ProviderListProps {
  providers: Record<string, ProviderConfig>
  onEdit: (key: string, config: ProviderConfig) => void
  onDelete: (key: string) => void
}

export function ProviderList({ providers, onEdit, onDelete }: ProviderListProps) {
  const entries = Object.entries(providers)

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12">
        <Key className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">暂无模型供应商</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {entries.map(([key, config]) => (
        <ProviderCard
          key={key}
          providerKey={key}
          config={config}
          onEdit={() => onEdit(key, config)}
          onDelete={() => onDelete(key)}
        />
      ))}
    </div>
  )
}
