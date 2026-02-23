'use client'

import { useState, useCallback } from 'react'
import { useMachines, useCreateMachine, useDeleteMachine } from '@/hooks/use-machines'
import { MachineList } from '@/components/machines/machine-list'
import { MachineForm, type MachineFormData } from '@/components/machines/machine-form'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus } from 'lucide-react'
import type { Machine } from '@/lib/machines/types'

export default function MachinesPage() {
  const { data: machines, isLoading, error, mutate } = useMachines()
  const { trigger: createMachine, isMutating: creating } = useCreateMachine()
  const { trigger: deleteMachine } = useDeleteMachine()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMachine, setEditingMachine] = useState<Machine | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Machine | null>(null)

  const handleAdd = useCallback(() => {
    setEditingMachine(undefined)
    setDialogOpen(true)
  }, [])

  const handleEdit = useCallback((machine: Machine) => {
    setEditingMachine(machine)
    setDialogOpen(true)
  }, [])

  const handleSubmit = useCallback(
    async (data: MachineFormData) => {
      // Don't send empty password — preserve existing password on edit
      const payload = { ...data }
      if (!payload.password) {
        delete payload.password
      }
      if (!payload.passphrase) {
        delete payload.passphrase
      }

      if (editingMachine) {
        await fetch(`/api/machines/${editingMachine.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await createMachine(payload)
      }
      await mutate()
      setDialogOpen(false)
    },
    [editingMachine, createMachine, mutate]
  )

  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget) {
      await deleteMachine({ id: deleteTarget.id })
      await mutate()
      setDeleteTarget(null)
    }
  }, [deleteTarget, deleteMachine, mutate])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner text="加载中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-destructive">加载失败: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">机器管理</h1>
          <p className="text-sm text-muted-foreground">管理远程服务器连接</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          添加机器
        </Button>
      </div>

      <MachineList
        machines={machines ?? []}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
      />

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingMachine ? '编辑机器' : '添加机器'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <MachineForm
            machine={editingMachine}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            submitting={creating}
          />
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除机器"
        description={`确定要删除机器 "${deleteTarget?.name ?? ''}" 吗？此操作不可撤销。`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        destructive
        confirmLabel="删除"
      />
    </div>
  )
}
