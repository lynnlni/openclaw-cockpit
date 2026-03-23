'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { RefreshCw, Pencil } from 'lucide-react'
import type { Machine } from '@/lib/machines/types'
import { useMachines } from '@/hooks/use-machines'
import { MachineForm, type MachineFormData } from '@/components/machines/machine-form'

interface QuickActionsProps {
  machine: Machine
  onRefreshStatus?: () => Promise<unknown>
  statusRefreshing?: boolean
}

export function QuickActions({ machine, onRefreshStatus, statusRefreshing }: QuickActionsProps) {
  const { mutate: mutateMachines } = useMachines()
  const [editOpen, setEditOpen] = useState(false)
  const [updating, setUpdating] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (onRefreshStatus) await onRefreshStatus()
  }, [onRefreshStatus])

  const handleEditSubmit = useCallback(async (data: MachineFormData) => {
    const payload = { ...data }
    if (!payload.password) delete payload.password
    if (!payload.passphrase) delete payload.passphrase

    setUpdating(true)
    try {
      const res = await fetch(`/api/machines/${machine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? '更新失败')
      }
      await mutateMachines()
      setEditOpen(false)
      toast.success('设备已更新')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败')
    } finally {
      setUpdating(false)
    }
  }, [machine.id, mutateMachines])

  if (machine.connectionType === 'push') {
    return (
      <>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>编辑设备</p></TooltipContent>
          </Tooltip>
        </div>

        <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>编辑设备</AlertDialogTitle>
            </AlertDialogHeader>
            <MachineForm
              machine={machine}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditOpen(false)}
              submitting={updating}
            />
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Button 1: Refresh status in-card */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleRefresh}
              disabled={statusRefreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${statusRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>刷新</p></TooltipContent>
        </Tooltip>

        {/* Button 2: Inline edit dialog */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-xs" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom"><p>编辑设备</p></TooltipContent>
        </Tooltip>
      </div>

      <AlertDialog open={editOpen} onOpenChange={setEditOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>编辑设备</AlertDialogTitle>
          </AlertDialogHeader>
          <MachineForm
            machine={machine}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditOpen(false)}
            submitting={updating}
          />
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
