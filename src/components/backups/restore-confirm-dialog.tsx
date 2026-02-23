'use client'

import type { BackupSnapshot } from '@/lib/backup/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AlertTriangle } from 'lucide-react'

interface RestoreConfirmDialogProps {
  open: boolean
  snapshot: BackupSnapshot | null
  currentMachineName?: string
  currentMachineHost?: string
  onConfirm: () => void
  onCancel: () => void
}

export function RestoreConfirmDialog({
  open,
  snapshot,
  currentMachineName,
  currentMachineHost,
  onConfirm,
  onCancel,
}: RestoreConfirmDialogProps) {
  const sourceName = snapshot?.machineName
  const sourceHost = snapshot?.machineHost
  const isCrossMachine = !!(sourceName && currentMachineName && sourceName !== currentMachineName)

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCrossMachine ? '跨服务器恢复' : '确认恢复'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              {isCrossMachine && (
                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    此快照来自服务器「{sourceName}」({sourceHost ?? '?'})，
                    当前恢复目标是「{currentMachineName}」({currentMachineHost ?? '?'})。
                    跨服务器恢复可能导致配置冲突，请仔细确认。
                  </span>
                </div>
              )}
              <p>
                确定要从快照「{snapshot?.name ?? ''}」恢复吗？当前配置将被覆盖，恢复前会自动创建安全快照。
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isCrossMachine ? '确认跨服务器恢复' : '恢复'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
