'use client'

import { useRef, useCallback } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Upload } from 'lucide-react'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
  onImport: (file: File) => void
  importing?: boolean
}

export function ImportDialog({ open, onClose, onImport, importing }: ImportDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImport = useCallback(() => {
    const file = fileRef.current?.files?.[0]
    if (file) {
      onImport(file)
    }
  }, [onImport])

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>导入备份</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            选择 .tar.gz 备份文件进行导入
          </p>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <input
              ref={fileRef}
              type="file"
              accept=".tar.gz,.tgz"
              className="text-sm text-foreground file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:text-foreground"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleImport} disabled={importing}>
            {importing ? '导入中...' : '导入'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
