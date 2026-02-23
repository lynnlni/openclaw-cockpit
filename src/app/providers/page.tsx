'use client'

import { useState, useCallback } from 'react'
import { useMachine } from '@/store/machine-context'
import { useProviders, useConfig } from '@/hooks/use-config'
import { ProviderList } from '@/components/providers/provider-list'
import { ProviderForm } from '@/components/providers/provider-form'
import { ModelDefaultsForm } from '@/components/providers/model-defaults-form'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Server } from 'lucide-react'
import type { ProviderConfig } from '@/lib/config/types'

export default function ProvidersPage() {
  const { selectedMachineId } = useMachine()
  const { data: providers, isLoading, mutate } = useProviders(selectedMachineId ?? undefined)
  const { data: config, mutate: mutateConfig } = useConfig(selectedMachineId ?? undefined)

  const [formOpen, setFormOpen] = useState(false)
  const [editingKey, setEditingKey] = useState<string | undefined>()
  const [editingConfig, setEditingConfig] = useState<ProviderConfig | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = useCallback(() => {
    setEditingKey(undefined)
    setEditingConfig(undefined)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((key: string, provConfig: ProviderConfig) => {
    setEditingKey(key)
    setEditingConfig(provConfig)
    setFormOpen(true)
  }, [])

  const handleSubmit = useCallback(
    async (key: string, provConfig: ProviderConfig) => {
      if (!selectedMachineId) return
      setSubmitting(true)
      try {
        await fetch(`/api/instances/${selectedMachineId}/config/providers`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, config: provConfig }),
        })
        await mutate()
        setFormOpen(false)
      } finally {
        setSubmitting(false)
      }
    },
    [selectedMachineId, mutate]
  )

  const handleDelete = useCallback(async () => {
    if (!selectedMachineId || !deleteTarget) return
    await fetch(`/api/instances/${selectedMachineId}/config/providers/${encodeURIComponent(deleteTarget)}`, {
      method: 'DELETE',
    })
    await mutate()
    setDeleteTarget(null)
  }, [selectedMachineId, deleteTarget, mutate])

  const handleSaveDefaults = useCallback(
    async (primary: string, fallback: string[]) => {
      if (!selectedMachineId) return
      await fetch(`/api/instances/${selectedMachineId}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: { primary, fallback } }),
      })
      await mutateConfig()
    },
    [selectedMachineId, mutateConfig]
  )

  if (!selectedMachineId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Server className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">请先在侧边栏选择一台机器</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner text="加载供应商配置..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">模型/API Key</h1>
          <p className="text-sm text-muted-foreground">管理模型供应商和 API 密钥</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          添加供应商
        </Button>
      </div>

      <ModelDefaultsForm
        primary={config?.models?.primary ?? ''}
        fallback={config?.models?.fallback ?? []}
        onSave={handleSaveDefaults}
      />

      <ProviderList
        providers={providers ?? {}}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
      />

      <AlertDialog open={formOpen} onOpenChange={setFormOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingKey ? '编辑供应商' : '添加供应商'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <ProviderForm
            providerKey={editingKey}
            config={editingConfig}
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
            submitting={submitting}
          />
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除供应商"
        description={`确定要删除供应商 "${deleteTarget ?? ''}" 吗？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
        confirmLabel="删除"
      />
    </div>
  )
}
