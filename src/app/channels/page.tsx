'use client'

import { useState, useCallback } from 'react'
import { useMachine } from '@/store/machine-context'
import { useChannels } from '@/hooks/use-config'
import { ChannelList } from '@/components/channels/channel-list'
import { ChannelForm } from '@/components/channels/channel-form'
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
import type { ChannelConfig } from '@/lib/config/types'

export default function ChannelsPage() {
  const { selectedMachineId } = useMachine()
  const { data: channels, isLoading, mutate } = useChannels(selectedMachineId ?? undefined)

  const [formOpen, setFormOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingChannel, setEditingChannel] = useState<ChannelConfig | undefined>()
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = useCallback(() => {
    setEditingIndex(null)
    setEditingChannel(undefined)
    setFormOpen(true)
  }, [])

  const handleEdit = useCallback((index: number, channel: ChannelConfig) => {
    setEditingIndex(index)
    setEditingChannel(channel)
    setFormOpen(true)
  }, [])

  const handleSubmit = useCallback(
    async (channel: ChannelConfig) => {
      if (!selectedMachineId) return
      setSubmitting(true)
      try {
        const method = editingIndex !== null ? 'PUT' : 'POST'
        const url = editingIndex !== null
          ? `/api/instances/${selectedMachineId}/config/channels/${editingIndex}`
          : `/api/instances/${selectedMachineId}/config/channels`
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(channel),
        })
        await mutate()
        setFormOpen(false)
      } finally {
        setSubmitting(false)
      }
    },
    [selectedMachineId, editingIndex, mutate]
  )

  const handleDelete = useCallback(async () => {
    if (!selectedMachineId || deleteIndex === null) return
    await fetch(`/api/instances/${selectedMachineId}/config/channels/${deleteIndex}`, {
      method: 'DELETE',
    })
    await mutate()
    setDeleteIndex(null)
  }, [selectedMachineId, deleteIndex, mutate])

  const handleToggle = useCallback(
    async (index: number, enabled: boolean) => {
      if (!selectedMachineId || !channels) return
      const channel = channels[index]
      if (!channel) return
      await fetch(`/api/instances/${selectedMachineId}/config/channels/${index}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...channel, enabled }),
      })
      await mutate()
    },
    [selectedMachineId, channels, mutate]
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
        <LoadingSpinner text="加载渠道配置..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">渠道配置</h1>
          <p className="text-sm text-muted-foreground">管理消息渠道</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          添加渠道
        </Button>
      </div>

      <ChannelList
        channels={channels ?? []}
        onEdit={handleEdit}
        onDelete={setDeleteIndex}
        onToggle={handleToggle}
      />

      <AlertDialog open={formOpen} onOpenChange={setFormOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingIndex !== null ? '编辑渠道' : '添加渠道'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <ChannelForm
            channel={editingChannel}
            onSubmit={handleSubmit}
            onCancel={() => setFormOpen(false)}
            submitting={submitting}
          />
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog
        open={deleteIndex !== null}
        title="删除渠道"
        description="确定要删除此渠道配置吗？"
        onConfirm={handleDelete}
        onCancel={() => setDeleteIndex(null)}
        destructive
        confirmLabel="删除"
      />
    </div>
  )
}
