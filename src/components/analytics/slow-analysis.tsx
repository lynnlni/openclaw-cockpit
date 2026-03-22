'use client'

import type { LaneErrorEvent, SessionTrace } from '@/lib/analytics/types'
import { fmtMs, fmtTime } from '@/lib/analytics/format'
import { cn } from '@/lib/utils'

interface Props {
  laneErrors: LaneErrorEvent[]
  sessions: SessionTrace[]
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function LaneBadge({ lane }: { lane: string }) {
  const short = lane.split(':').pop() ?? lane
  return (
    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
      {short}
    </span>
  )
}

function SummaryCard({
  timeouts,
  others,
}: {
  timeouts: LaneErrorEvent[]
  others: LaneErrorEvent[]
}) {
  const durations = timeouts.map((e) => e.durationMs).filter((d) => d > 0)
  const avgMs = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
  const maxMs = durations.reduce((max, d) => (d > max ? d : max), 0)

  const laneCounts = new Map<string, number>()
  for (const e of timeouts) {
    const lane = e.lane.split(':').pop() ?? e.lane
    laneCounts.set(lane, (laneCounts.get(lane) ?? 0) + 1)
  }
  const topLanes = Array.from(laneCounts.entries()).sort((a, b) => b[1] - a[1])

  if (timeouts.length === 0 && others.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        当前时间窗口内无错误记录。
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">根因分析</h3>
      {timeouts.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-xs font-medium text-foreground">LLM 超时</span>
            <span className="font-mono text-xs text-red-400">{timeouts.length} 次</span>
          </div>
          <div className="ml-4 grid grid-cols-3 gap-2">
            <div className="rounded bg-secondary p-2">
              <div className="text-[10px] text-muted-foreground">平均耗时</div>
              <div className="font-mono text-xs text-yellow-400">{fmtMs(Math.round(avgMs))}</div>
            </div>
            <div className="rounded bg-secondary p-2">
              <div className="text-[10px] text-muted-foreground">最长耗时</div>
              <div className="font-mono text-xs text-red-400">{fmtMs(maxMs)}</div>
            </div>
            <div className="rounded bg-secondary p-2">
              <div className="text-[10px] text-muted-foreground">影响 Lane</div>
              <div className="font-mono text-xs text-foreground">{laneCounts.size}</div>
            </div>
          </div>
          {topLanes.length > 0 && (
            <div className="ml-4 flex flex-wrap gap-1">
              {topLanes.map(([lane, count]) => (
                <span key={lane} className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-400">
                  {lane} ×{count}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {others.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-400" />
            <span className="text-xs font-medium text-foreground">其他错误</span>
            <span className="font-mono text-xs text-orange-400">{others.length} 次</span>
          </div>
        </div>
      )}
    </div>
  )
}

function ErrorRow({ ev, idx }: { ev: LaneErrorEvent; idx: number }) {
  return (
    <div
      className={cn(
        'grid grid-cols-[6rem_5rem_1fr_auto] items-center gap-2 py-1.5 text-xs',
        idx % 2 === 0 ? 'bg-transparent' : 'bg-secondary/30',
      )}
    >
      <span className="font-mono text-muted-foreground">{fmtTime(ev.time)}</span>
      <LaneBadge lane={ev.lane} />
      <span className={cn('truncate', ev.isLLMTimeout ? 'text-red-400' : 'text-orange-400')}>
        {truncate(ev.error, 80)}
      </span>
      <span className={cn('font-mono shrink-0', ev.durationMs > 30000 ? 'text-red-400' : 'text-yellow-400')}>
        {fmtMs(ev.durationMs)}
      </span>
    </div>
  )
}

function SessionTimeline({ session }: { session: SessionTrace }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {session.sessionId.slice(0, 12)}
          </span>
          {session.channel && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {session.channel}
            </span>
          )}
          {session.outcome && (
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-[10px] font-medium',
                session.outcome === 'completed' && 'bg-emerald-500/10 text-emerald-400',
                session.outcome === 'error' && 'bg-red-500/10 text-red-400',
                session.outcome === 'skipped' && 'bg-secondary text-muted-foreground',
              )}
            >
              {session.outcome}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {session.waitMs != null && session.waitMs > 0 && (
            <span className="text-[10px] text-yellow-400">等待 {fmtMs(session.waitMs)}</span>
          )}
          {session.durationMs != null && (
            <span className={cn('text-[10px]', session.durationMs > 30000 ? 'text-red-400' : 'text-muted-foreground')}>
              处理 {fmtMs(session.durationMs)}
            </span>
          )}
        </div>
      </div>

      {session.timeline.length > 0 && (
        <div className="relative ml-2 space-y-0">
          {session.timeline.map((point, i) => (
            <div key={`${point.event}-${point.time}-${i}`} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                    point.event === 'stuck' && 'bg-red-400',
                    point.event.startsWith('state:processing') && 'bg-yellow-400',
                    point.event.startsWith('state:idle') && 'bg-emerald-400',
                    !['stuck'].includes(point.event) &&
                      !point.event.startsWith('state:') &&
                      'bg-primary/60',
                  )}
                />
                {i < session.timeline.length - 1 && (
                  <div className="w-px flex-1 bg-border/40" style={{ minHeight: '12px' }} />
                )}
              </div>
              <div className="min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-medium text-foreground">
                    {point.event}
                  </span>
                  {point.offsetMs !== undefined && point.offsetMs > 0 && (
                    <span className="font-mono text-[10px] text-muted-foreground/60">
                      +{fmtMs(point.offsetMs)}
                    </span>
                  )}
                </div>
                {point.detail && (
                  <div className="font-mono text-[10px] text-muted-foreground/60">{point.detail}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SlowAnalysis({ laneErrors, sessions }: Props) {
  const timeouts = laneErrors.filter((e) => e.isLLMTimeout)
  const others = laneErrors.filter((e) => !e.isLLMTimeout)

  const slowSessions = sessions
    .filter((s) => {
      const hasStuck = s.timeline.some((p) => p.event === 'stuck')
      const isLong = (s.durationMs ?? 0) > 20000 || (s.totalMs ?? 0) > 25000
      const hasError = s.outcome === 'error'
      return hasStuck || isLong || hasError
    })
    .slice(0, 10)

  return (
    <div className="space-y-4">
      <SummaryCard timeouts={timeouts} others={others} />

      {timeouts.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            LLM 超时明细
            <span className="ml-2 font-mono text-xs font-normal text-muted-foreground">
              最近 {Math.min(timeouts.length, 50)} 条
            </span>
          </h3>
          <div className="max-h-52 overflow-y-auto">
            {timeouts.slice(-50).reverse().map((ev, i) => (
              <ErrorRow key={`${ev.time}-${ev.lane}-${i}`} ev={ev} idx={i} />
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">其他 Lane 错误</h3>
          <div className="max-h-40 overflow-y-auto">
            {others.slice(-30).reverse().map((ev, i) => (
              <ErrorRow key={`${ev.time}-${ev.lane}-${i}`} ev={ev} idx={i} />
            ))}
          </div>
        </div>
      )}

      {slowSessions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            慢 / 异常 Session
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (处理 &gt;20s 或含卡住事件)
            </span>
          </h3>
          <div className="space-y-2">
            {slowSessions.map((s) => (
              <SessionTimeline key={s.sessionId} session={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
