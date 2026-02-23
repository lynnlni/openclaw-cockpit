'use client'

import type { BackupSnapshot } from '@/lib/backup/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Archive, Download, Trash2, RotateCcw, Server } from 'lucide-react'

interface BackupListProps {
  snapshots: BackupSnapshot[]
  onDownload: (snapshot: BackupSnapshot) => void
  onDelete: (snapshot: BackupSnapshot) => void
  onRestore: (snapshot: BackupSnapshot) => void
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }
  return dateStr
}

export function BackupList({ snapshots, onDownload, onDelete, onRestore }: BackupListProps) {
  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12">
        <Archive className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">暂无备份快照</p>
        <p className="text-xs text-muted-foreground/60">点击"创建快照"开始备份</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">名称</th>
            <th className="px-4 py-3 font-medium">来源服务器</th>
            <th className="px-4 py-3 font-medium">类型</th>
            <th className="px-4 py-3 font-medium">创建时间</th>
            <th className="px-4 py-3 font-medium">大小</th>
            <th className="px-4 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {snapshots.map((snapshot) => (
            <tr
              key={snapshot.name}
              className="border-b border-border last:border-b-0 hover:bg-muted/30"
            >
              <td className="px-4 py-3 text-sm font-medium text-foreground font-mono">
                {snapshot.name}
              </td>
              <td className="px-4 py-3">
                {snapshot.machineName ? (
                  <div className="flex items-center gap-1.5">
                    <Server className="h-3 w-3 text-muted-foreground/60" />
                    <span className="text-sm text-foreground">{snapshot.machineName}</span>
                    {snapshot.machineHost && (
                      <span className="text-xs text-muted-foreground">({snapshot.machineHost})</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">未知</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant="secondary"
                  className={
                    snapshot.type === 'full'
                      ? 'bg-blue-500/15 text-blue-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }
                >
                  {snapshot.type === 'full' ? '完整' : '工作区'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDate(snapshot.createdAt)}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {snapshot.size}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRestore(snapshot)}
                    title="恢复"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDownload(snapshot)}
                    title="下载"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDelete(snapshot)}
                    title="删除"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
