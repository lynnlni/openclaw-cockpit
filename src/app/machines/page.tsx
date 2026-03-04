'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
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
import { PushOnboardingDialog } from '@/components/machines/push-onboarding-dialog'
import { Plus } from 'lucide-react'
import type { Machine } from '@/lib/machines/types'

export default function MachinesPage() {
  const { data: machines, isLoading, error, mutate } = useMachines()
  const { trigger: createMachine, isMutating: creating } = useCreateMachine()
  const { trigger: deleteMachine } = useDeleteMachine()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMachine, setEditingMachine] = useState<Machine | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Machine | null>(null)
  const [updating, setUpdating] = useState(false)

  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingMachine, setOnboardingMachine] = useState<Machine | null>(null)
  const [onboardingToken, setOnboardingToken] = useState('')
  const [revokeTarget, setRevokeTarget] = useState<Machine | null>(null)
  const [revoking, setRevoking] = useState(false)

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
        setUpdating(true)
        try {
          const res = await fetch(`/api/machines/${editingMachine.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body.error ?? '更新失败')
          }
          await mutate()
          setDialogOpen(false)
          toast.success('设备已更新')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '更新失败')
        } finally {
          setUpdating(false)
        }
      } else {
        try {
          const newMachine = await createMachine(payload)
          await mutate()

          if (newMachine && data.connectionType === 'push') {
            // Auto-generate token and open onboarding
            const tokenRes = await fetch(`/api/machines/${newMachine.id}/push-token`, {
              method: 'POST',
            })
            if (tokenRes.ok) {
              const tokenBody = await tokenRes.json()
              const token = tokenBody.data?.token ?? ''
              setOnboardingMachine(newMachine)
              setOnboardingToken(token)
              setDialogOpen(false)
              setOnboardingOpen(true)
            } else {
              setDialogOpen(false)
              toast.success('推送设备已添加，请在备份页面生成令牌')
            }
          } else {
            setDialogOpen(false)
            toast.success('设备已添加')
          }
        } catch (error) {
          toast.error(error instanceof Error ? error.message : '添加失败')
        }
      }
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

  const handleRevokeToken = useCallback((machine: Machine) => {
    setRevokeTarget(machine)
  }, [])

  const handleRevokeConfirm = useCallback(async () => {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      const res = await fetch(`/api/machines/${revokeTarget.id}/push-token`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? '吊销失败')
      }
      await mutate()
      setRevokeTarget(null)
      toast.success('推送令牌已吊销')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '吊销失败')
    } finally {
      setRevoking(false)
    }
  }, [revokeTarget, mutate])

  const handleOpenOnboarding = useCallback(async (machine: Machine) => {
    try {
      const tokenRes = await fetch(`/api/machines/${machine.id}/push-token`, {
        method: 'POST',
      })
      if (!tokenRes.ok) {
        const body = await tokenRes.json().catch(() => ({}))
        throw new Error(body.error ?? '生成令牌失败')
      }
      const tokenBody = await tokenRes.json()
      const token = tokenBody.data?.token ?? ''
      await mutate()
      setOnboardingMachine(machine)
      setOnboardingToken(token)
      setOnboardingOpen(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成令牌失败')
    }
  }, [mutate])

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
          <h1 className="text-lg font-semibold text-foreground">设备管理</h1>
          <p className="text-sm text-muted-foreground">管理 SSH 直连与推送接入设备</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          添加设备
        </Button>
      </div>

      <MachineList
        machines={machines ?? []}
        onEdit={handleEdit}
        onDelete={setDeleteTarget}
        onOpenOnboarding={handleOpenOnboarding}
        onRevokeToken={handleRevokeToken}
      />

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {editingMachine ? '编辑设备' : '添加设备'}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <MachineForm
            machine={editingMachine}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            submitting={editingMachine ? updating : creating}
          />
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除设备"
        description={`确定要删除设备 "${deleteTarget?.name ?? ''}" 吗？此操作不可撤销。`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        destructive
        confirmLabel="删除"
      />

      <ConfirmDialog
        open={revokeTarget !== null}
        title="吊销推送令牌"
        description={`确定要吊销设备「${revokeTarget?.name ?? ''}」的推送令牌吗？吊销后 OpenClaw 将无法推送备份，需重新配置 Skill。`}
        onConfirm={handleRevokeConfirm}
        onCancel={() => setRevokeTarget(null)}
        destructive
        confirmLabel={revoking ? '吊销中…' : '吊销'}
      />

      {onboardingMachine && (
        <PushOnboardingDialog
          open={onboardingOpen}
          machine={onboardingMachine}
          token={onboardingToken}
          onClose={() => {
            setOnboardingOpen(false)
            mutate()
          }}
        />
      )}
    </div>
  )
}
