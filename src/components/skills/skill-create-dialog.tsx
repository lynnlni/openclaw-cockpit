'use client'

import { useState, useCallback } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface SkillCreateDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description: string) => void
}

const inputClass =
  'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export function SkillCreateDialog({ open, onClose, onCreate }: SkillCreateDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleCreate = useCallback(() => {
    if (name.trim()) {
      onCreate(name.trim(), description.trim())
      setName('')
      setDescription('')
      onClose()
    }
  }, [name, description, onCreate, onClose])

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>创建技能</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">名称</label>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-skill"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">描述</label>
            <textarea
              className={`${inputClass} h-20 resize-none`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="技能描述..."
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleCreate} disabled={!name.trim()}>
            创建
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
