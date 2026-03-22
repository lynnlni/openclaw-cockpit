'use client'

import type { AnalyticsStats } from '@/lib/analytics/types'
import { fmtMs } from '@/lib/analytics/format'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'

interface Props {
  stats: AnalyticsStats
  selectedMetric?: string
  onSelect?: (metric: string | undefined) => void
}

function StatRow({
  label,
  value,
  sub,
  highlight,
  metric,
  selectedMetric,
  onSelect,
}: {
  label: string
  value: string | number
  sub?: string
  highlight?: 'ok' | 'warn' | 'error' | 'muted'
  metric?: string
  selectedMetric?: string
  onSelect?: (metric: string | undefined) => void
}) {
  const isClickable = !!metric && !!onSelect
  const isSelected = metric !== undefined && metric === selectedMetric
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-2 py-1',
        isClickable && 'cursor-pointer rounded px-1 -mx-1 hover:bg-secondary/60 transition-colors',
        isSelected && 'bg-primary/10 rounded px-1 -mx-1',
      )}
      onClick={
        isClickable
          ? () => onSelect?.(isSelected ? undefined : metric)
          : undefined
      }
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-mono text-xs font-medium',
          highlight === 'ok' && 'text-emerald-400',
          highlight === 'warn' && 'text-yellow-400',
          highlight === 'error' && 'text-red-400',
          highlight === 'muted' && 'text-muted-foreground',
          !highlight && 'text-foreground',
        )}
      >
        {value}
        {sub && <span className="ml-1 text-muted-foreground">{sub}</span>}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {title}
      </div>
      <div className="divide-y divide-border/40">{children}</div>
    </div>
  )
}

export function StatsOverview({ stats, selectedMetric, onSelect }: Props) {
  const gatewayLabel =
    stats.gatewayStatus === 'ok'
      ? '正常'
      : stats.gatewayStatus === 'degraded'
        ? '异常'
        : '未知'
  const gatewayHighlight =
    stats.gatewayStatus === 'ok' ? 'ok' : stats.gatewayStatus === 'degraded' ? 'error' : 'muted'

  const totalErrors = stats.webhookErrors + stats.messageErrors
  const errorHighlight = totalErrors > 0 ? 'error' : 'muted'

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">状态总览</h2>
        <div className="flex items-center gap-2">
          {!stats.hasDebugLogs && (
            <div className="flex items-center gap-1 rounded bg-yellow-500/10 px-2 py-0.5 text-[10px] text-yellow-400">
              <Info className="h-3 w-3" />
              <span>建议开启 debug 日志</span>
            </div>
          )}
          <span className="text-[10px] text-muted-foreground">
            窗口 {stats.windowMinutes}m
          </span>
        </div>
      </div>

      <Section title="服务状态">
        <StatRow
          label="Gateway 探针"
          value={gatewayLabel}
          highlight={gatewayHighlight}
        />
        <StatRow label="处理中" value={stats.inProgress} highlight={stats.inProgress > 0 ? 'ok' : 'muted'} />
        <StatRow label="等待中" value={stats.waiting} highlight={stats.waiting > 0 ? 'warn' : 'muted'} />
      </Section>

      <Section title="消息生命周期">
        <StatRow label="收到 Webhook" value={stats.webhooksReceived} />
        <StatRow label="已处理" value={stats.webhooksProcessed} />
        <StatRow label="消息入队" value={stats.messagesQueued} />
        <StatRow label="执行完成" value={stats.messagesCompleted} highlight={stats.messagesCompleted > 0 ? 'ok' : undefined} />
        <StatRow label="已跳过" value={stats.messagesSkipped} highlight={stats.messagesSkipped > 0 ? 'muted' : undefined} />
        <StatRow label="处理错误" value={stats.messageErrors} highlight={stats.messageErrors > 0 ? 'error' : 'muted'} metric="messageErrors" selectedMetric={selectedMetric} onSelect={onSelect} />
      </Section>

      <Section title="性能">
        <StatRow label="最大耗时" value={fmtMs(stats.maxDurationMs)} highlight={stats.maxDurationMs > 60000 ? 'warn' : undefined} />
        <StatRow label="平均耗时" value={fmtMs(stats.avgDurationMs)} />
        <StatRow label="Lane 入队" value={stats.laneEnqueues} />
        <StatRow label="Lane 最大等待" value={fmtMs(stats.laneMaxWaitMs)} highlight={stats.laneMaxWaitMs > 10000 ? 'warn' : 'muted'} />
      </Section>

      <Section title="异常">
        <StatRow label="LLM 超时" value={stats.llmTimeouts} highlight={stats.llmTimeouts > 0 ? 'error' : 'muted'} metric="llmTimeouts" selectedMetric={selectedMetric} onSelect={onSelect} />
        <StatRow label="Webhook 错误" value={stats.webhookErrors} highlight={stats.webhookErrors > 0 ? 'error' : 'muted'} metric="webhookErrors" selectedMetric={selectedMetric} onSelect={onSelect} />
        <StatRow label="卡住的会话" value={stats.stuckSessions} highlight={stats.stuckSessions > 0 ? 'error' : 'muted'} metric="stuckSessions" selectedMetric={selectedMetric} onSelect={onSelect} />
        <StatRow label="Tool Loop 警告" value={stats.toolLoopWarnings} highlight={stats.toolLoopWarnings > 0 ? 'warn' : 'muted'} />
        <StatRow label="Tool Loop 阻断" value={stats.toolLoopBlocks} highlight={stats.toolLoopBlocks > 0 ? 'error' : 'muted'} />
      </Section>
    </div>
  )
}
