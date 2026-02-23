'use client'

import { useState, useCallback } from 'react'
import { StepIndicator } from '@/components/shared/step-indicator'
import { DeployLogViewer } from '@/components/deploy/deploy-log-viewer'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import type { DeployEnvironment } from '@/lib/deploy/types'

interface DeployWizardProps {
  machineId: string
  onComplete: () => void
}

const STEPS = [
  { label: '环境检测', description: '通过 SSH 检测远程服务器环境' },
  { label: '安装 OpenClaw', description: '安装 Node.js 和 OpenClaw' },
  { label: '初始化配置', description: '创建工作目录和配置文件' },
]

interface EnvDisplayProps {
  env: DeployEnvironment
}

function EnvDisplay({ env }: EnvDisplayProps) {
  const rows = [
    { label: '操作系统', value: env.os === 'unknown' ? '未识别' : env.os },
    { label: '架构', value: env.arch },
    { label: '包管理器', value: env.packageManager === 'unknown' ? '未识别' : env.packageManager },
    { label: 'Node.js', value: env.nodeVersion ?? '未安装' },
    { label: 'npm', value: env.npmVersion ?? '未安装' },
    { label: 'OpenClaw', value: env.openclawVersion ?? '未安装' },
    { label: '守护进程', value: env.daemonType === 'none' ? '无' : env.daemonType },
  ]

  return (
    <div className="rounded-md border border-border bg-background p-3">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border/50 last:border-0">
              <td className="py-1.5 pr-4 text-muted-foreground">{row.label}</td>
              <td className="py-1.5 font-mono text-foreground">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DeployWizard({ machineId, onComplete }: DeployWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [env, setEnv] = useState<DeployEnvironment | null>(null)
  const [stepResults, setStepResults] = useState<Record<number, boolean>>({})

  const addLog = useCallback((msg: string) => {
    setLogs((prev) => [...prev, msg])
  }, [])

  const handleDetect = useCallback(async () => {
    setRunning(true)
    setError(null)
    addLog('[环境检测] 正在通过 SSH 连接远程服务器...')

    try {
      const res = await fetch(`/api/deploy/${machineId}/detect`, {
        method: 'POST',
      })
      const body = await res.json()

      if (!res.ok || !body.success) {
        const errMsg = body.error ?? '环境检测失败'
        setError(errMsg)
        addLog(`[错误] ${errMsg}`)
        return
      }

      const detected = body.data as DeployEnvironment & { raw?: string }
      setEnv(detected)
      setStepResults((prev) => ({ ...prev, 0: true }))

      addLog(`[环境检测] 操作系统: ${detected.os} (${detected.arch})`)
      addLog(`[环境检测] Node.js: ${detected.nodeVersion ?? '未安装'}`)
      addLog(`[环境检测] OpenClaw: ${detected.openclawVersion ?? '未安装'}`)
      addLog(`[环境检测] 守护进程: ${detected.daemonType}`)
      addLog('[环境检测] 完成')

      setCurrentStep(1)
    } catch {
      setError('网络请求失败，请检查 dashboard 服务是否正常运行')
      addLog('[错误] 网络请求失败')
    } finally {
      setRunning(false)
    }
  }, [machineId, addLog])

  const handleInstall = useCallback(async () => {
    setRunning(true)
    setError(null)
    addLog('[安装] 开始安装 OpenClaw...')

    try {
      const res = await fetch(`/api/deploy/${machineId}/install`, {
        method: 'POST',
      })
      const body = await res.json()

      if (!res.ok || !body.success) {
        const errMsg = body.error ?? '安装失败'
        setError(errMsg)
        addLog(`[错误] ${errMsg}`)
        return
      }

      const result = body.data
      if (result.results) {
        for (const r of result.results) {
          if (r.output) addLog(`[${r.step}] ${r.output.slice(0, 500)}`)
          if (r.error) addLog(`[${r.step} 错误] ${r.error}`)
        }
      }

      if (result.completed) {
        setStepResults((prev) => ({ ...prev, 1: true }))
        addLog('[安装] OpenClaw 安装完成')
        setCurrentStep(2)
      } else {
        setError('安装过程未全部完成，请查看日志')
        setStepResults((prev) => ({ ...prev, 1: false }))
      }
    } catch {
      setError('网络请求失败')
      addLog('[错误] 网络请求失败')
    } finally {
      setRunning(false)
    }
  }, [machineId, addLog])

  const handleInit = useCallback(async () => {
    setRunning(true)
    setError(null)
    addLog('[初始化] 创建工作目录...')

    try {
      const res = await fetch(`/api/deploy/${machineId}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const body = await res.json()

      if (!res.ok || !body.success) {
        const errMsg = body.error ?? '初始化失败'
        setError(errMsg)
        addLog(`[错误] ${errMsg}`)
        return
      }

      setStepResults((prev) => ({ ...prev, 2: true }))
      addLog(`[初始化] 工作目录已创建: ${body.data.path}`)
      addLog('[初始化] 完成')
      onComplete()
    } catch {
      setError('网络请求失败')
      addLog('[错误] 网络请求失败')
    } finally {
      setRunning(false)
    }
  }, [machineId, addLog, onComplete])

  const handleNext = useCallback(() => {
    switch (currentStep) {
      case 0:
        handleDetect()
        break
      case 1:
        handleInstall()
        break
      case 2:
        handleInit()
        break
    }
  }, [currentStep, handleDetect, handleInstall, handleInit])

  const buttonLabel = (() => {
    if (running) return '执行中...'
    switch (currentStep) {
      case 0: return '开始检测'
      case 1: return env?.openclawVersion ? '跳过 (已安装)' : '开始安装'
      case 2: return '初始化工作目录'
      default: return '执行'
    }
  })()

  const canSkipInstall = currentStep === 1 && env?.openclawVersion

  return (
    <div className="space-y-6">
      <StepIndicator
        steps={STEPS.map((s, i) => ({
          ...s,
          description: stepResults[i] === true
            ? '已完成'
            : stepResults[i] === false
              ? '失败'
              : s.description,
        }))}
        currentStep={currentStep}
      />

      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="mb-1 text-sm font-medium text-foreground">
          {STEPS[currentStep].label}
        </h4>
        <p className="mb-4 text-xs text-muted-foreground">
          {STEPS[currentStep].description}
        </p>

        {currentStep === 0 && env && <EnvDisplay env={env} />}

        {error && (
          <div className="my-3 flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {stepResults[currentStep] === true && (
          <div className="my-3 flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>步骤完成</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleNext} disabled={running}>
            {running && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            {buttonLabel}
          </Button>
          {canSkipInstall && (
            <Button
              variant="outline"
              onClick={() => {
                setStepResults((prev) => ({ ...prev, 1: true }))
                addLog('[安装] OpenClaw 已安装，跳过')
                setCurrentStep(2)
              }}
              disabled={running}
            >
              跳过此步骤
            </Button>
          )}
        </div>
      </div>

      {logs.length > 0 && <DeployLogViewer logs={logs} />}
    </div>
  )
}
