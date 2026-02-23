'use client'

import { useState, useCallback } from 'react'
import type { Machine } from '@/lib/machines/types'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface CloneDialogProps {
  open: boolean
  machines: Machine[]
  currentMachineId: string
  onClone: (sourceMachineId: string, targetMachineId: string) => void
  onClose: () => void
  cloning?: boolean
}

const selectClass =
  'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export function CloneDialog({
  open,
  machines,
  currentMachineId,
  onClone,
  onClose,
  cloning,
}: CloneDialogProps) {
  const [source, setSource] = useState(currentMachineId)
  const [target, setTarget] = useState('')

  const handleClone = useCallback(() => {
    if (source && target && source !== target) {
      onClone(source, target)
    }
  }, [source, target, onClone])

  const otherMachines = machines.filter((m) => m.id !== source)

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>克隆配置</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">源机器</label>
            <select
              className={selectClass}
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">目标机器</label>
            <select
              className={selectClass}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">选择目标机器</option>
              {otherMachines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            将源机器的配置克隆到目标机器，目标机器的当前配置将被覆盖。
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClone}
            disabled={cloning || !target || source === target}
          >
            {cloning ? '克隆中...' : '克隆'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
