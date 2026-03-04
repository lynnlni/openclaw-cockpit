'use client'

import { useState, useCallback } from 'react'
import { CheckCircle2, XCircle, Loader2, Server, Cpu, Box, Activity } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { Machine, MachineStatus } from '@/lib/machines/types'

interface MachineInfoDialogProps {
  open: boolean
  machine: Machine
  onClose: () => void
}

type TestState = 'idle' | 'loading' | 'done'

interface FetchedStatus extends MachineStatus {
  error?: string
}

export function MachineInfoDialog({ open, machine, onClose }: MachineInfoDialogProps) {
  const [state, setState] = useState<TestState>('idle')
  const [info, setInfo] = useState<FetchedStatus | null>(null)

  const handleTest = useCallback(async () => {
    setState('loading')
    setInfo(null)
    try {
      const res = await fetch(`/api/machines/${machine.id}/status`)
      const body = await res.json()
      if (res.ok && body.success) {
        setInfo(body.data as FetchedStatus)
      } else {
        setInfo({ online: false, openclawInstalled: false, openclawRunning: false, error: body.error ?? '获取失败' })
      }
    } catch {
      setInfo({ online: false, openclawInstalled: false, openclawRunning: false, error: '请求失败' })
    } finally {
      setState('done')
    }
  }, [machine.id])

  const handleOpenChange = useCallback((v: boolean) => {
    if (!v) {
      setState('idle')
      setInfo(null)
      onClose()
    }
  }, [onClose])

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4 text-muted-foreground" />
            {machine.name}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 pt-1">
          {/* Basic info */}
          <dl className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <dt>主机</dt>
              <dd className="font-mono text-foreground">{machine.host}:{machine.port}</dd>
            </div>
            <div className="flex justify-between">
              <dt>用户名</dt>
              <dd className="font-mono text-foreground">{machine.username}</dd>
            </div>
            <div className="flex justify-between">
              <dt>认证</dt>
              <dd className="text-foreground">{machine.authType === 'password' ? '密码' : '密钥'}</dd>
            </div>
          </dl>

          {/* Status area */}
          {state === 'idle' && (
            <Button className="w-full" size="sm" onClick={handleTest}>
              测试连接并读取信息
            </Button>
          )}

          {state === 'loading' && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              连接中…
            </div>
          )}

          {state === 'done' && info && (
            <div className="space-y-3">
              {/* Connection result */}
              <div className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                info.online
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {info.online ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0" />
                )}
                {info.online ? '连接成功' : (info.error ?? '连接失败')}
              </div>

              {/* Detailed info */}
              {info.online && (
                <dl className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Box className="h-3 w-3" /> OpenClaw
                    </dt>
                    <dd className={info.openclawInstalled ? 'text-foreground' : 'text-muted-foreground/50'}>
                      {info.openclawInstalled
                        ? (info.openclawVersion ? `v${info.openclawVersion}` : '已安装')
                        : '未安装'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Activity className="h-3 w-3" /> 服务状态
                    </dt>
                    <dd className={info.openclawRunning ? 'text-emerald-400' : 'text-muted-foreground/50'}>
                      {info.openclawRunning ? '运行中' : '未运行'}
                    </dd>
                  </div>
                  {info.nodeVersion && (
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-1.5 text-muted-foreground">
                        <Cpu className="h-3 w-3" /> Node.js
                      </dt>
                      <dd className="font-mono text-foreground">{info.nodeVersion}</dd>
                    </div>
                  )}
                </dl>
              )}

              <Button variant="outline" size="sm" className="w-full" onClick={handleTest}>
                重新测试
              </Button>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClose}>关闭</Button>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
