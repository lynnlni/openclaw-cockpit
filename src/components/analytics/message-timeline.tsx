'use client'

import type { SessionTrace } from '@/lib/analytics/types'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
  sessions: SessionTrace[]
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function fmtMs(ms: number | undefined): string {
  if (ms === undefined) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${Math.round(ms / 100) / 10}s`
}

function OutcomeBadge({ outcome }: { outcome?: string }) {
  if (!outcome) return <span className="text-muted-foreground">进行中</span>
  const map: Record<string, string> = {
    completed: 'text-emerald-400',
    skipped: 'text-yellow-400',
    error: 'text-red-400',
  }
  const label: Record<string, string> = {
    completed: '完成',
    skipped: '跳过',
    error: '错误',
  }
  return (
    <span className={cn('font-medium', map[outcome] ?? 'text-muted-foreground')}>
      {label[outcome] ?? outcome}
    </span>
  )
}

function TimelineDot({ event }: { event: string }) {
  const isError = event.includes('error') || event.includes('stuck')
  const isComplete = event.includes('complete')
  const isState = event.startsWith('state:')
  return (
    <span
      className={cn(
        'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
        isError && 'bg-red-400',
        isComplete && 'bg-emerald-400',
        isState && 'bg-sky-400',
        !isError && !isComplete && !isState && 'bg-muted-foreground/40',
      )}
    />
  )
}

function SessionRow({ trace }: { trace: SessionTrace }) {
  const [expanded, setExpanded] = useState(false)
  const Icon = expanded ? ChevronDown : ChevronRight

  return (
    <>
      <tr
        className="cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="py-1.5 px-3 w-4">
          <Icon className="h-3 w-3 text-muted-foreground" />
        </td>
        <td className="py-1.5 px-2 font-mono text-xs text-foreground/70 max-w-[90px] truncate">
          {trace.sessionId.slice(0, 12)}
        </td>
        <td className="py-1.5 px-2 text-xs text-muted-foreground">
          {trace.channel ?? '—'}
        </td>
        <td className="py-1.5 px-2 text-xs text-muted-foreground">
          {trace.queuedAt ? fmtTime(trace.queuedAt) : '—'}
        </td>
        <td className="py-1.5 px-2 text-xs text-muted-foreground">
          {fmtMs(trace.waitMs)}
        </td>
        <td className="py-1.5 px-2 text-xs text-muted-foreground">
          {fmtMs(trace.durationMs)}
        </td>
        <td className="py-1.5 px-2 text-xs text-muted-foreground">
          {fmtMs(trace.totalMs)}
        </td>
        <td className="py-1.5 px-2 text-xs">
          <OutcomeBadge outcome={trace.outcome} />
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="px-8 pb-3 pt-0">
            {trace.timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">无时间线数据</p>
            ) : (
              <div className="relative border-l border-border/50 pl-4 space-y-1.5">
                {trace.timeline.map((pt, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="absolute -left-[3px] mt-[5px]">
                      <TimelineDot event={pt.event} />
                    </div>
                    <span className="w-20 shrink-0 font-mono text-[10px] text-muted-foreground/70">
                      {pt.offsetMs !== undefined
                        ? pt.offsetMs === 0
                          ? 'T+0'
                          : `T+${fmtMs(pt.offsetMs)}`
                        : fmtTime(pt.time)}
                    </span>
                    <span className="text-[10px] font-medium text-foreground/80">{pt.event}</span>
                    {pt.detail && (
                      <span className="text-[10px] text-muted-foreground">{pt.detail}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {trace.error && (
              <p className="mt-2 text-xs text-red-400">错误: {trace.error}</p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export function MessageTimeline({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-8">
        <p className="text-sm text-muted-foreground">暂无会话数据</p>
        <p className="text-xs text-muted-foreground/60">
          需要开启 debug 日志: <code className="rounded bg-muted px-1">logging.level = &quot;debug&quot;</code>
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">时间点追踪</h3>
        <p className="text-xs text-muted-foreground">点击行展开完整时间线</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20">
              <th className="w-4 px-3" />
              <th className="py-2 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">会话 ID</th>
              <th className="py-2 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Channel</th>
              <th className="py-2 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">入队时间</th>
              <th className="py-2 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">等待</th>
              <th className="py-2 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">执行</th>
              <th className="py-2 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">总耗时</th>
              <th className="py-2 px-2 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">结果</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {sessions.map((trace) => (
              <SessionRow key={trace.sessionId} trace={trace} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
