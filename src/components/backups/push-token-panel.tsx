'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Copy, RefreshCw, Download, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Machine } from '@/lib/machines/types'

interface PushTokenPanelProps {
  machine: Machine
  onMachineUpdated: () => void
}

const RETAIN_OPTIONS = [
  { value: 1, label: '1 天' },
  { value: 2, label: '2 天' },
  { value: 3, label: '3 天' },
  { value: 7, label: '7 天' },
] as const

export function PushTokenPanel({ machine, onMachineUpdated }: PushTokenPanelProps) {
  const [token, setToken] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [retainDays, setRetainDays] = useState<1 | 2 | 3 | 7>(machine.pushRetainDays ?? 7)

  const hasStoredToken = Boolean(machine.pushToken)

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/machines/${machine.id}/push-token`, {
        method: 'POST',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? '生成令牌失败')
      }
      const body = await res.json()
      setToken(body.data?.token ?? null)
      setShowToken(true)
      onMachineUpdated()
      toast.success('推送令牌已生成')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成令牌失败')
    } finally {
      setGenerating(false)
    }
  }, [machine.id, onMachineUpdated])

  const handleRevoke = useCallback(async () => {
    if (!confirm('确定要吊销令牌吗？吊销后 OpenClaw 脚本将无法推送备份，需要重新安装 Skill。')) {
      return
    }
    setRevoking(true)
    try {
      const res = await fetch(`/api/machines/${machine.id}/push-token`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? '吊销令牌失败')
      }
      setToken(null)
      setShowToken(false)
      onMachineUpdated()
      toast.success('推送令牌已吊销')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '吊销令牌失败')
    } finally {
      setRevoking(false)
    }
  }, [machine.id, onMachineUpdated])

  const handleCopyToken = useCallback(() => {
    if (token) {
      navigator.clipboard.writeText(token).then(() => {
        toast.success('令牌已复制')
      })
    }
  }, [token])

  const handleDownloadSkill = useCallback(async () => {
    if (!token) {
      toast.error('请先生成令牌再下载 Skill 文件')
      return
    }
    try {
      const res = await fetch(`/api/machines/${machine.id}/push-skill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? '下载失败')
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const filenameMatch = disposition.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] ?? 'backup-push.md'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Skill 文件已下载')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '下载失败')
    }
  }, [machine.id, token])

  const handleRetainDaysChange = useCallback(
    async (days: 1 | 2 | 3 | 7) => {
      setRetainDays(days)
      try {
        await fetch(`/api/machines/${machine.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pushRetainDays: days }),
        })
        onMachineUpdated()
      } catch {
        // Non-critical; local state still updated
      }
    },
    [machine.id, onMachineUpdated]
  )

  const maskedToken = token
    ? `${token.slice(0, 8)}${'•'.repeat(20)}${token.slice(-4)}`
    : null

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">推送接入配置</h3>
        <Badge variant="secondary" className="bg-sky-500/15 text-sky-400 text-xs">
          推送接入
        </Badge>
      </div>

      {/* Token section */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          推送令牌
        </label>
        {token ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono text-foreground break-all">
              {showToken ? token : maskedToken}
            </code>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowToken((v) => !v)}
              title={showToken ? '隐藏' : '显示'}
            >
              {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopyToken}
              title="复制令牌"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : hasStoredToken ? (
          <p className="text-xs text-muted-foreground">
            令牌已设置（已加密存储）。轮换后可查看新令牌。
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            尚未生成令牌。点击"生成令牌"后再下载 Skill 文件。
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={generating}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {hasStoredToken ? '轮换令牌' : '生成令牌'}
          </Button>
          {hasStoredToken && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRevoke}
              disabled={revoking}
              className="text-destructive hover:text-destructive"
            >
              吊销令牌
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadSkill}
            disabled={!token}
            title={!token ? '请先生成令牌' : undefined}
          >
            <Download className="h-3.5 w-3.5" />
            下载 Skill 文件
          </Button>
        </div>

        {token && (
          <p className="text-xs text-amber-400 bg-amber-500/10 rounded-md px-3 py-2">
            令牌仅显示一次，请立即下载 Skill 文件或复制保存。
          </p>
        )}
      </div>

      {/* Retain days */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          备份保留天数
        </label>
        <div className="flex gap-2 flex-wrap">
          {RETAIN_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleRetainDaysChange(value)}
              className={[
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                retainDays === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          超过保留期的旧快照将在下次推送时自动删除
        </p>
      </div>

      {/* Last push info */}
      {(machine.lastPushAt || machine.lastPushVersion || machine.dashboardUrl) && (
        <div className="border-t border-border pt-3 space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            推送配置信息
          </label>
          {machine.dashboardUrl && (
            <p className="text-xs text-muted-foreground">
              Dashboard 地址：<code className="bg-muted px-1 rounded">{machine.dashboardUrl}</code>
            </p>
          )}
          {!machine.dashboardUrl && (
            <p className="text-xs text-amber-400">
              未设置 Dashboard 地址，Skill 文件中将使用当前浏览器访问地址。
              建议在机器设置中填写固定地址。
            </p>
          )}
          {machine.lastPushAt && (
            <p className="text-xs text-muted-foreground">
              最近推送：{new Date(machine.lastPushAt).toLocaleString('zh-CN')}
            </p>
          )}
          {machine.lastPushVersion && (
            <p className="text-xs text-muted-foreground">
              版本：{machine.lastPushVersion}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
