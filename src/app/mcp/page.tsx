'use client'

import { useState, useCallback } from 'react'
import { useMachine } from '@/store/machine-context'
import { useMcpServers } from '@/hooks/use-mcp-servers'
import { McpServerList } from '@/components/mcp/mcp-server-list'
import { McpServerForm } from '@/components/mcp/mcp-server-form'
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
import type { MCPServerConfig } from '@/lib/config/types'

export default function McpPage() {
  const { selectedMachineId } = useMachine()
  const { data: servers, isLoading, error, mutate } = useMcpServers(selectedMachineId ?? undefined)

  const [formOpen, setFormOpen] = useState(false)
  const [editingName, setEditingName] = useState<string | undefined>()
  const [editingConfig, setEditingConfig] = useState<MCPServerConfig | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = useCallback(() => {
    setEditingName(undefined)
    setEditingConfig(undefined)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((name: string, config: MCPServerConfig) => {
    setEditingName(name)
    setEditingConfig(config)
    setFormOpen(true)
  }, [])

  const handleSubmit = useCallback(
    async (name: string, config: MCPServerConfig) => {
      if (!selectedMachineId) return
      setSubmitting(true)
      try {
        await fetch(`/api/instances/${selectedMachineId}/mcp`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, config }),
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
    await fetch(`/api/instances/${selectedMachineId}/mcp/${encodeURIComponent(deleteTarget)}`, {
      method: 'DELETE',
    })
    await mutate()
    setDeleteTarget(null)
  }, [selectedMachineId, deleteTarget, mutate])

  const handleToggle = useCallback(
    async (name: string, enabled: boolean) => {
      if (!selectedMachineId || !servers) return
      const existing = servers[name]
      if (!existing) return
      await fetch(`/api/instances/${selectedMachineId}/mcp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config: { ...existing, enabled } }),
      })
      await mutate()
    },
    [selectedMachineId, servers, mutate]
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
        <LoadingSpinner text="加载 MCP 服务..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">MCP 服务</h1>
          <p className="text-sm text-muted-foreground">管理 MCP 服务器配置</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          添加服务
        </Button>
      </div>

      <McpServerList
        servers={servers ?? {}}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        onToggle={handleToggle}
      />

      <AlertDialog open={formOpen} onOpenChange={setFormOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingName ? '编辑 MCP 服务' : '添加 MCP 服务'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <McpServerForm
            name={editingName}
            config={editingConfig}
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
            submitting={submitting}
          />
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除 MCP 服务"
        description={`确定要删除 MCP 服务 "${deleteTarget ?? ''}" 吗？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
        confirmLabel="删除"
      />
    </div>
  )
}
