'use client'

import { useState } from 'react'
import { useMachine } from '@/store/machine-context'
import { useAnalytics } from '@/hooks/use-analytics'
import { StatsOverview } from '@/components/analytics/stats-overview'
import { MessageTimeline } from '@/components/analytics/message-timeline'
import { SlowAnalysis } from '@/components/analytics/slow-analysis'
import { DebugToggle } from '@/components/analytics/debug-toggle'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { BarChart2, RefreshCw } from 'lucide-react'
import { SSH_REMOTE_ACCESS_ENABLED } from '@/lib/ssh/feature'

const WINDOW_OPTIONS = [
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '3h', value: 180 },
  { label: '6h', value: 360 },
  { label: '24h', value: 1440 },
]

const DRILL_DOWN_METRICS = new Set(['llmTimeouts', 'webhookErrors', 'stuckSessions', 'messageErrors'])

export default function AnalyticsPage() {
  const { selectedMachineId } = useMachine()
  const [windowMinutes, setWindowMinutes] = useState(180)
  const [selectedMetric, setSelectedMetric] = useState<string | undefined>(undefined)

  const { data, error, isLoading, isValidating, mutate } = useAnalytics(
    SSH_REMOTE_ACCESS_ENABLED ? selectedMachineId ?? undefined : undefined,
    windowMinutes,
  )

  const handleSelectMetric = (metric: string | undefined) => {
    setSelectedMetric(metric)
  }

  const showDrillDown = selectedMetric !== undefined && DRILL_DOWN_METRICS.has(selectedMetric)

  if (!SSH_REMOTE_ACCESS_ENABLED) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <BarChart2 className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">SSH 远程访问已暂时关闭</p>
      </div>
    )
  }

  if (!selectedMachineId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <BarChart2 className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">请先选择机器</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">消息分析</h1>
          <p className="text-xs text-muted-foreground">
            {data
              ? `扫描了 ${data.logLinesScanned.toLocaleString()} 行日志 · 更新于 ${new Date(data.stats.updatedAt).toLocaleTimeString('zh-CN')}`
              : '从 OpenClaw 日志文件解析消息处理数据'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Debug / diagnostics toggles */}
          <DebugToggle machineId={selectedMachineId} />

          <div className="h-4 w-px bg-border" />

          {/* Window selector */}
          <div className="flex rounded-md border border-border bg-card overflow-hidden">
            {WINDOW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setWindowMinutes(opt.value)}
                className={`px-2.5 py-1 text-xs transition-colors ${
                  windowMinutes === opt.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => mutate()}
            disabled={isValidating}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isValidating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <LoadingSpinner text="读取日志中..." />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">读取失败: {error.message}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            请确认 SSH 连接正常，且 OpenClaw 已安装并运行过
          </p>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          <StatsOverview
            stats={data.stats}
            selectedMetric={selectedMetric}
            onSelect={handleSelectMetric}
          />
          <div className="min-h-0">
            {showDrillDown ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    慢响应分析
                  </span>
                  <button
                    onClick={() => setSelectedMetric(undefined)}
                    className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground underline"
                  >
                    返回时间线
                  </button>
                </div>
                <SlowAnalysis
                  laneErrors={data.laneErrors}
                  sessions={data.sessions}
                />
              </div>
            ) : (
              <MessageTimeline sessions={data.sessions} />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
