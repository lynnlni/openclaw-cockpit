'use client'

import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Copy, Download, Eye, EyeOff } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { Machine } from '@/lib/machines/types'

export interface PushOnboardingDialogProps {
  open: boolean
  machine: Machine
  token: string
  onClose: () => void
}

export function PushOnboardingDialog({
  open,
  machine,
  token,
  onClose,
}: PushOnboardingDialogProps) {
  const [showToken, setShowToken] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [dashboardUrl, setDashboardUrl] = useState('')
  const [savingUrl, setSavingUrl] = useState(false)

  // Initialize URL: stored value → current browser origin
  useEffect(() => {
    setDashboardUrl(machine.dashboardUrl || window.location.origin)
  }, [machine.dashboardUrl, machine.id])

  const maskedToken = token
    ? `${token.slice(0, 8)}${'•'.repeat(20)}${token.slice(-4)}`
    : ''

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(token).then(() => {
      toast.success('令牌已复制')
    })
  }, [token])

  // Persist URL to machine on blur (non-blocking)
  const handleUrlBlur = useCallback(async () => {
    if (!dashboardUrl || dashboardUrl === machine.dashboardUrl) return
    setSavingUrl(true)
    try {
      await fetch(`/api/machines/${machine.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardUrl }),
      })
    } catch {
      // non-critical: URL is also passed inline at download time
    } finally {
      setSavingUrl(false)
    }
  }, [machine.id, machine.dashboardUrl, dashboardUrl])

  const handleDownloadSkill = useCallback(async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/machines/${machine.id}/push-skill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Pass dashboardUrl inline so Skill file is correct even before save completes
        body: JSON.stringify({ token, dashboardUrl: dashboardUrl || undefined }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? '下载失败')
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') ?? ''
      const filenameMatch = disposition.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] ?? `backup-push-${machine.name}.md`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Skill 文件已下载')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '下载失败')
    } finally {
      setDownloading(false)
    }
  }, [machine.id, machine.name, token, dashboardUrl])

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            推送接入设备「{machine.name}」已创建
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-5 pt-1">
          {/* Step 1: Token */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
              第一步：复制推送令牌
            </h3>
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
                {showToken ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleCopy}
                title="复制令牌"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-xs text-amber-400 bg-amber-500/10 rounded-md px-3 py-2">
              令牌仅此次显示，请立即下载 Skill 文件或复制保存。
            </p>
          </section>

          {/* Step 2: Dashboard URL */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
              第二步：配置 Dashboard 地址
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={dashboardUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDashboardUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="http://192.168.1.10:3000"
                className="flex-1 rounded-md border border-border bg-muted px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {savingUrl && (
                <span className="text-xs text-muted-foreground shrink-0">保存中…</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              OpenClaw 将通过此地址上报备份。已自动填入当前访问地址，若机器 IP 不同请手动修改。
            </p>
          </section>

          {/* Step 3: Download Skill */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
              第三步：下载并安装 Skill
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSkill}
              disabled={downloading || !dashboardUrl}
              className="w-full justify-center gap-2"
            >
              <Download className="h-3.5 w-3.5" />
              下载 backup-push-{machine.name}.md
            </Button>
            <p className="text-xs text-muted-foreground">
              将下载的 .md 文件发送给 OpenClaw，它将自动完成安装与定时备份配置。
            </p>
          </section>

          {/* Summary */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">
              配置摘要
            </h3>
            <dl className="space-y-1 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-foreground/70">备份计划：</dt>
                <dd>
                  <code className="bg-muted px-1 rounded">
                    {machine.pushCronSchedule ?? '0 2 * * *'}
                  </code>
                  <span className="ml-1">（每天凌晨 2 点）</span>
                </dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 font-medium text-foreground/70">保留天数：</dt>
                <dd>{machine.pushRetainDays ?? 7} 天</dd>
              </div>
            </dl>
          </section>

          {/* Close */}
          <div className="flex justify-end pt-1">
            <Button onClick={onClose}>完成</Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
