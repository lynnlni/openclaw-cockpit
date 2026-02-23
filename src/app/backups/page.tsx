'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useMachine } from '@/store/machine-context'
import { useMachines } from '@/hooks/use-machines'
import { useBackups } from '@/hooks/use-backups'
import { BackupList } from '@/components/backups/backup-list'
import { BackupActions } from '@/components/backups/backup-actions'
import { ImportDialog } from '@/components/backups/import-dialog'
import { RestoreConfirmDialog } from '@/components/backups/restore-confirm-dialog'
import { CloneDialog } from '@/components/backups/clone-dialog'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Plus, Copy, Server } from 'lucide-react'
import type { BackupSnapshot } from '@/lib/backup/types'

async function safeFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options)
  if (!res.ok) {
    let message = `请求失败 (${res.status})`
    try {
      const body = await res.json()
      if (body.error) message = body.error
    } catch {
      // ignore parse errors
    }
    throw new Error(message)
  }
  return res
}

export default function BackupsPage() {
  const { selectedMachineId } = useMachine()
  const { data: machines } = useMachines()
  const { data: snapshots, isLoading, mutate } = useBackups(selectedMachineId ?? undefined)

  const [creating, setCreating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [cloneOpen, setCloneOpen] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<BackupSnapshot | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BackupSnapshot | null>(null)

  const handleCreate = useCallback(async () => {
    if (!selectedMachineId) return
    setCreating(true)
    try {
      const res = await safeFetch(`/api/backups/${selectedMachineId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'full' }),
      })
      const body = await res.json()
      await mutate()
      toast.success(`快照 ${body.data?.name ?? ''} 创建成功`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '创建快照失败')
    } finally {
      setCreating(false)
    }
  }, [selectedMachineId, mutate])

  const handleExport = useCallback(async () => {
    if (!selectedMachineId) return
    setExporting(true)
    try {
      const res = await safeFetch(`/api/backups/${selectedMachineId}/export`)
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const rfc5987Match = disposition.match(/filename\*=UTF-8''(.+)/)
      const basicMatch = disposition.match(/filename="(.+)"/)
      const rawFilename = rfc5987Match?.[1] ?? basicMatch?.[1]
      const filename = rawFilename ? decodeURIComponent(rawFilename) : `openclaw-export-${currentMachine?.name ?? selectedMachineId}.tar.gz`

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('导出成功')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }, [selectedMachineId])

  const handleImport = useCallback(
    async (file: File) => {
      if (!selectedMachineId) return
      try {
        const formData = new FormData()
        formData.append('file', file)
        await safeFetch(`/api/backups/${selectedMachineId}/import`, {
          method: 'POST',
          body: formData,
        })
        await mutate()
        setImportOpen(false)
        toast.success('导入成功')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '导入失败')
      }
    },
    [selectedMachineId, mutate]
  )

  const handleDownload = useCallback(
    async (snapshot: BackupSnapshot) => {
      if (!selectedMachineId) return
      try {
        const res = await safeFetch(
          `/api/backups/${selectedMachineId}/snapshots/${encodeURIComponent(snapshot.name)}/download`
        )
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${snapshot.name}.tar.gz`
        a.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '下载失败')
      }
    },
    [selectedMachineId]
  )

  const handleRestore = useCallback(async () => {
    if (!selectedMachineId || !restoreTarget) return
    try {
      const res = await safeFetch(
        `/api/backups/${selectedMachineId}/snapshots/${encodeURIComponent(restoreTarget.name)}/restore`,
        { method: 'POST' }
      )
      const body = await res.json()
      await mutate()
      setRestoreTarget(null)
      toast.success(`恢复成功（安全快照: ${body.data?.safetySnapshot ?? 'N/A'}）`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '恢复失败')
    }
  }, [selectedMachineId, restoreTarget, mutate])

  const handleDelete = useCallback(async () => {
    if (!selectedMachineId || !deleteTarget) return
    try {
      await safeFetch(
        `/api/backups/${selectedMachineId}/snapshots/${encodeURIComponent(deleteTarget.name)}`,
        { method: 'DELETE' }
      )
      await mutate()
      setDeleteTarget(null)
      toast.success('快照已删除')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败')
    }
  }, [selectedMachineId, deleteTarget, mutate])

  const handleClone = useCallback(
    async (source: string, target: string) => {
      try {
        await safeFetch(`/api/backups/clone`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceMachineId: source, targetMachineId: target, includeConfig: true }),
        })
        setCloneOpen(false)
        toast.success('克隆成功')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '克隆失败')
      }
    },
    []
  )

  const currentMachine = selectedMachineId
    ? machines?.find((m) => m.id === selectedMachineId)
    : undefined

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
        <LoadingSpinner text="加载备份..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">备份恢复</h1>
          <p className="text-sm text-muted-foreground">管理配置快照和备份</p>
        </div>
        <div className="flex items-center gap-2">
          <BackupActions
            onExport={handleExport}
            onImport={() => setImportOpen(true)}
            exporting={exporting}
          />
          <Button variant="outline" size="sm" onClick={() => setCloneOpen(true)}>
            <Copy className="h-3.5 w-3.5" />
            克隆
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            <Plus className="h-4 w-4" />
            {creating ? '创建中...' : '创建快照'}
          </Button>
        </div>
      </div>

      <BackupList
        snapshots={snapshots ?? []}
        onDownload={handleDownload}
        onDelete={setDeleteTarget}
        onRestore={setRestoreTarget}
      />

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      <RestoreConfirmDialog
        open={restoreTarget !== null}
        snapshot={restoreTarget}
        currentMachineName={currentMachine?.name}
        currentMachineHost={currentMachine?.host}
        onConfirm={handleRestore}
        onCancel={() => setRestoreTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除快照"
        description={`确定要删除快照 "${deleteTarget?.name ?? ''}" 吗？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
        confirmLabel="删除"
      />

      <CloneDialog
        open={cloneOpen}
        machines={machines ?? []}
        currentMachineId={selectedMachineId}
        onClone={handleClone}
        onClose={() => setCloneOpen(false)}
      />
    </div>
  )
}
