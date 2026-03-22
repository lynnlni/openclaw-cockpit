/**
 * OpenClaw NDJSON log parser — v2026.3.13 compatible.
 *
 * Two log line variants:
 *   A) {"0":"{\"subsystem\":\"diagnostic\"}","1":"session state: sessionId=X ...","_meta":{...},"time":"..."}
 *   B) {"0":"[diagnostic] lane task error: lane=main durationMs=86488 error=\"...\"","_meta":{...},"time":"..."}
 *
 * Variant A: key "0" is JSON-encoded subsystem metadata; actual message is in key "1"+
 * Variant B: key "0" starts with "[subsystem] " prefix
 *
 * Key diagnostic message formats (from diagnostic subsystem, v2026.3.13):
 *   session state:     sessionId=X sessionKey=Y prev=P new=N reason="..." queueDepth=N
 *   lane enqueue:      lane=X queueSize=N
 *   lane dequeue:      lane=X waitMs=N queueSize=N
 *   lane task done:    lane=X durationMs=N         (NEW in 2026.x)
 *   lane task error:   lane=X durationMs=N error="..." (NEW in 2026.x)
 *   run registered:    sessionId=X runId=Y          (NEW in 2026.x)
 *   run cleared:       sessionId=X runId=Y          (NEW in 2026.x)
 *   run active check:  sessionId=X ...              (NEW in 2026.x)
 *   stuck session:     sessionId=X state=processing age=Ns
 *   tool loop:         sessionId=X tool=Y level=Z action=W
 *   webhook received:  channel=X type=Y chatId=Z total=N   (requires diagnostics.enabled)
 *   webhook processed: channel=X duration=Nms processed=N  (requires diagnostics.enabled)
 *   message queued:    sessionId=X source=Z queueDepth=N   (requires diagnostics.enabled)
 *   message processed: channel=X outcome=completed duration=Nms (requires diagnostics.enabled)
 */

import type { AnalyticsData, AnalyticsStats, LaneErrorEvent, LaneTaskDoneEvent, LogEvent, SessionTrace, TimelinePoint } from './types'

// ── NDJSON line parser ────────────────────────────────────────────────────────

/**
 * Extract the actual message text from a log object.
 * Handles two variants:
 *   A) key "0" is JSON subsystem metadata → use key "1"+ as message
 *   B) key "0" starts with "[subsystem] " → strip prefix, use rest as message
 */
function extractMessage(obj: Record<string, unknown>): { message: string; subsystem?: string } {
  const key0 = typeof obj['0'] === 'string' ? obj['0'] : null

  // Variant A: key "0" is JSON like {"subsystem":"diagnostic"}
  if (key0 && key0.startsWith('{"')) {
    try {
      const meta = JSON.parse(key0) as Record<string, unknown>
      const subsystem = typeof meta.subsystem === 'string' ? meta.subsystem : undefined
      // Collect keys 1, 2, 3, ...
      const parts: string[] = []
      for (let i = 1; i <= 9; i++) {
        const v = obj[String(i)]
        if (v === undefined) break
        if (typeof v === 'string') parts.push(v)
        else parts.push(JSON.stringify(v))
      }
      return { message: parts.join(' '), subsystem }
    } catch {
      // fall through to default
    }
  }

  // Variant B: key "0" starts with "[subsystem] message"
  if (key0 && key0.startsWith('[')) {
    const bracketEnd = key0.indexOf('] ')
    if (bracketEnd > 0) {
      const subsystem = key0.slice(1, bracketEnd)
      const message = key0.slice(bracketEnd + 2)
      return { message, subsystem }
    }
  }

  // Default: join all numeric keys
  const parts: string[] = []
  for (const key of Object.keys(obj).sort()) {
    if (!/^\d+$/.test(key)) continue
    const v = obj[key]
    if (typeof v === 'string') parts.push(v)
    else if (v != null) parts.push(JSON.stringify(v))
  }
  return { message: parts.join(' ') }
}

function parseNdjsonLine(raw: string): LogEvent | null {
  if (!raw.trim().startsWith('{')) return null
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>
    const meta = obj._meta as Record<string, unknown> | undefined
    const levelRaw = typeof meta?.logLevelName === 'string' ? meta.logLevelName : 'info'
    const time =
      typeof obj.time === 'string'
        ? obj.time
        : typeof meta?.date === 'string'
          ? meta.date
          : new Date().toISOString()
    const { message, subsystem: extractedSubsystem } = extractMessage(obj)
    if (!message.trim()) return null

    // Also try to get subsystem from _meta.name
    let subsystem = extractedSubsystem
    if (!subsystem && typeof meta?.name === 'string') {
      try {
        const nameMeta = JSON.parse(meta.name) as Record<string, unknown>
        if (typeof nameMeta.subsystem === 'string') subsystem = nameMeta.subsystem
      } catch { /* ignore */ }
    }

    return {
      time,
      level: levelRaw.toLowerCase(),
      subsystem,
      message,
      kv: parseKV(message),
    }
  } catch {
    return null
  }
}

// ── Key=value parser ──────────────────────────────────────────────────────────

function parseKV(msg: string): Record<string, string | number> {
  const result: Record<string, string | number> = {}
  const re = /(\w+)=("(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?|\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(msg)) !== null) {
    const key = m[1]!
    let val: string = m[2]!
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1).replace(/\\"/g, '"')
    }
    const num = Number(val)
    result[key] = isNaN(num) ? val : num
  }
  return result
}

function kv(event: LogEvent, key: string): string | undefined {
  const v = event.kv[key]
  return v !== undefined ? String(v) : undefined
}

function kvNum(event: LogEvent, key: string): number | undefined {
  const v = event.kv[key]
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const ms = v.match(/^(\d+(?:\.\d+)?)ms$/)
    if (ms) return parseFloat(ms[1]!)
    const s = v.match(/^(\d+(?:\.\d+)?)s$/)
    if (s) return Math.round(parseFloat(s[1]!) * 1000)
    const plain = parseFloat(v)
    return isNaN(plain) ? undefined : plain
  }
  return undefined
}

// ── Event classifiers ─────────────────────────────────────────────────────────

const MSG_TYPES = {
  // v2026.x primary events (always logged at debug level)
  laneEnqueue:      /^lane enqueue:/,
  laneDequeue:      /^lane dequeue:/,
  laneTaskDone:     /^lane task done:/,
  laneTaskError:    /^lane task error:/,
  sessionState:     /^session state:/,
  sessionStuck:     /^stuck session:/,
  runRegistered:    /^run registered:/,
  runCleared:       /^run cleared:/,
  runActiveCheck:   /^run active check:/,
  runAttempt:       /^run attempt:/,
  toolLoop:         /^tool loop:/,
  // Requires diagnostics.enabled=true
  webhookReceived:  /^webhook received:/,
  webhookProcessed: /^webhook processed:/,
  webhookError:     /^webhook error:/,
  messageQueued:    /^message queued:/,
  messageProcessed: /^message processed:/,
  heartbeat:        /^heartbeat:/,
} as const

type MsgType = keyof typeof MSG_TYPES

function classifyMessage(msg: string): MsgType | null {
  for (const [type, re] of Object.entries(MSG_TYPES)) {
    if ((re as RegExp).test(msg)) return type as MsgType
  }
  return null
}

function isLLMTimeout(errorStr: string): boolean {
  return /LLM request timed out|LLM.*timeout|FailoverError/i.test(errorStr)
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseLogs(rawLogs: string, windowMinutes: number): AnalyticsData {
  const cutoffMs = Date.now() - windowMinutes * 60 * 1000
  const lines = rawLogs.split('\n')

  // Counters
  let webhooksReceived = 0
  let webhooksProcessed = 0
  let webhookErrors = 0
  let messagesQueued = 0
  let messagesCompleted = 0
  let messagesSkipped = 0
  let messageErrors = 0
  let laneEnqueues = 0
  let laneMaxWaitMs = 0
  let laneTaskDone = 0
  let laneTaskErrors = 0
  let llmTimeouts = 0
  let stuckSessions = 0
  let toolLoopWarnings = 0
  let toolLoopBlocks = 0
  let hasDebugLogs = false
  let gatewayStatus: AnalyticsStats['gatewayStatus'] = 'unknown'
  let lastHeartbeatActive = 0
  let lastHeartbeatWaiting = 0
  let logLinesScanned = 0

  // Performance tracking from lane task done
  const taskDurations: number[] = []
  const laneErrors: LaneErrorEvent[] = []
  const laneTaskDones: LaneTaskDoneEvent[] = []

  // Per-session tracking for timeline
  const sessionMap = new Map<string, SessionTrace>()

  const getSession = (sessionId: string, ev: LogEvent): SessionTrace => {
    const existing = sessionMap.get(sessionId)
    if (existing) return existing
    const trace: SessionTrace = {
      sessionId,
      sessionKey: kv(ev, 'sessionKey'),
      channel: kv(ev, 'channel'),
      chatId: kv(ev, 'chatId'),
      messageId: kv(ev, 'messageId'),
      timeline: [],
      runAttempts: 0,
    }
    sessionMap.set(sessionId, trace)
    return trace
  }

  const addTimelinePoint = (trace: SessionTrace, point: TimelinePoint) => {
    if (trace.timeline.length > 0) {
      const first = new Date(trace.timeline[0]!.time).getTime()
      point.offsetMs = new Date(point.time).getTime() - first
    } else {
      point.offsetMs = 0
    }
    trace.timeline.push(point)
  }

  for (const raw of lines) {
    if (!raw.trim()) continue
    logLinesScanned++

    const ev = parseNdjsonLine(raw)
    if (!ev) continue

    // Only process events within the analysis window
    const evMs = new Date(ev.time).getTime()
    if (evMs < cutoffMs) continue

    if (ev.level === 'debug') hasDebugLogs = true

    // Only process diagnostic subsystem events
    if (ev.subsystem !== 'diagnostic' && ev.subsystem !== undefined) {
      // Also allow lines from embedded agent for session tracking
      if (!ev.subsystem.includes('diagnostic')) continue
    }

    const msgType = classifyMessage(ev.message)
    if (!msgType) continue

    switch (msgType) {
      case 'laneEnqueue': {
        laneEnqueues++
        break
      }

      case 'laneDequeue': {
        const waitMs = kvNum(ev, 'waitMs')
        if (waitMs !== undefined && waitMs > laneMaxWaitMs) laneMaxWaitMs = waitMs
        break
      }

      case 'laneTaskDone': {
        laneTaskDone++
        const durationMs = kvNum(ev, 'durationMs')
        if (durationMs !== undefined) taskDurations.push(durationMs)
        laneTaskDones.push({
          time: ev.time,
          lane: kv(ev, 'lane') ?? 'unknown',
          durationMs: durationMs ?? 0,
          sessionId: kv(ev, 'sessionId'),
        })
        // lane task done maps to completed message
        messagesCompleted++
        break
      }

      case 'laneTaskError': {
        laneTaskErrors++
        messageErrors++
        const errorStr = kv(ev, 'error') ?? ''
        const durationMs = kvNum(ev, 'durationMs') ?? 0
        if (isLLMTimeout(errorStr)) llmTimeouts++
        gatewayStatus = gatewayStatus === 'ok' ? 'ok' : 'degraded'
        laneErrors.push({
          time: ev.time,
          lane: kv(ev, 'lane') ?? 'unknown',
          durationMs,
          error: errorStr,
          isLLMTimeout: isLLMTimeout(errorStr),
          sessionId: kv(ev, 'sessionId'),
        })
        break
      }

      case 'sessionState': {
        const newState = kv(ev, 'new') ?? kv(ev, 'state')
        const sid = kv(ev, 'sessionId')
        if (sid && sid !== 'unknown' && !sid.startsWith('probe-')) {
          const trace = getSession(sid, ev)
          if (newState === 'processing' && !trace.processingAt) {
            trace.processingAt = ev.time
          }
          addTimelinePoint(trace, {
            event: `state:${newState ?? '?'}`,
            time: ev.time,
            detail: `prev=${kv(ev, 'prev') ?? '?'} depth=${kv(ev, 'queueDepth') ?? '?'}`,
          })
        }
        break
      }

      case 'sessionStuck': {
        stuckSessions++
        const sid = kv(ev, 'sessionId')
        const ageMs = kvNum(ev, 'age')
        if (sid && sid !== 'unknown') {
          const trace = getSession(sid, ev)
          addTimelinePoint(trace, {
            event: 'stuck',
            time: ev.time,
            detail: ageMs !== undefined ? `age=${Math.round(ageMs / 1000)}s` : undefined,
          })
        }
        break
      }

      case 'runRegistered': {
        const sid = kv(ev, 'sessionId')
        if (sid && sid !== 'unknown') {
          const trace = getSession(sid, ev)
          if (!trace.queuedAt) trace.queuedAt = ev.time
          addTimelinePoint(trace, {
            event: 'run:registered',
            time: ev.time,
            detail: `runId=${kv(ev, 'runId') ?? '?'}`,
          })
        }
        break
      }

      case 'runCleared': {
        const sid = kv(ev, 'sessionId')
        if (sid && sid !== 'unknown') {
          const trace = getSession(sid, ev)
          if (!trace.completedAt) {
            trace.completedAt = ev.time
            trace.outcome = 'completed'
          }
          addTimelinePoint(trace, {
            event: 'run:cleared',
            time: ev.time,
            detail: `runId=${kv(ev, 'runId') ?? '?'}`,
          })
          if (trace.queuedAt) {
            trace.totalMs = new Date(ev.time).getTime() - new Date(trace.queuedAt).getTime()
          }
          if (trace.processingAt) {
            trace.durationMs = new Date(ev.time).getTime() - new Date(trace.processingAt).getTime()
          }
          if (trace.queuedAt && trace.processingAt) {
            trace.waitMs = new Date(trace.processingAt).getTime() - new Date(trace.queuedAt).getTime()
          }
        }
        break
      }

      case 'runAttempt': {
        const sid = kv(ev, 'sessionId')
        const attempt = kvNum(ev, 'attempt') ?? 1
        if (sid && sid !== 'unknown') {
          const trace = getSession(sid, ev)
          trace.runAttempts = Math.max(trace.runAttempts, attempt)
          addTimelinePoint(trace, {
            event: `run#${attempt}`,
            time: ev.time,
            detail: `runId=${kv(ev, 'runId') ?? '?'}`,
          })
        }
        break
      }

      case 'toolLoop': {
        const action = kv(ev, 'action')
        if (action === 'block') toolLoopBlocks++
        else toolLoopWarnings++
        break
      }

      // ── Events that require diagnostics.enabled=true ──────────────────────

      case 'webhookReceived': {
        webhooksReceived++
        break
      }

      case 'webhookProcessed': {
        webhooksProcessed++
        break
      }

      case 'webhookError': {
        webhookErrors++
        gatewayStatus = 'degraded'
        break
      }

      case 'messageQueued': {
        messagesQueued++
        const sid = kv(ev, 'sessionId')
        if (sid && sid !== 'unknown') {
          const trace = getSession(sid, ev)
          if (!trace.queuedAt) trace.queuedAt = ev.time
          trace.channel = trace.channel ?? kv(ev, 'channel')
          addTimelinePoint(trace, {
            event: 'queued',
            time: ev.time,
            detail: `source=${kv(ev, 'source') ?? '?'}`,
          })
        }
        break
      }

      case 'messageProcessed': {
        const outcome = kv(ev, 'outcome') as 'completed' | 'skipped' | 'error' | undefined
        if (outcome === 'completed') messagesCompleted++
        else if (outcome === 'skipped') messagesSkipped++
        else if (outcome === 'error') messageErrors++
        const sid = kv(ev, 'sessionId')
        const durationMs = kvNum(ev, 'duration')
        if (sid && sid !== 'unknown') {
          const trace = getSession(sid, ev)
          trace.completedAt = ev.time
          trace.outcome = outcome
          trace.error = kv(ev, 'error')
          if (durationMs !== undefined) trace.durationMs = durationMs
          addTimelinePoint(trace, {
            event: outcome ?? 'done',
            time: ev.time,
            detail: durationMs !== undefined ? `${Math.round(durationMs / 100) / 10}s` : undefined,
          })
        }
        break
      }

      case 'heartbeat': {
        lastHeartbeatActive = kvNum(ev, 'active') ?? lastHeartbeatActive
        lastHeartbeatWaiting = kvNum(ev, 'waiting') ?? lastHeartbeatWaiting
        const wh = kv(ev, 'webhooks')
        if (wh) {
          const parts = wh.split('/')
          if (parts[0]) webhooksReceived = Math.max(webhooksReceived, parseInt(parts[0], 10) || 0)
          if (parts[1]) webhooksProcessed = Math.max(webhooksProcessed, parseInt(parts[1], 10) || 0)
          if (parts[2]) webhookErrors = Math.max(webhookErrors, parseInt(parts[2], 10) || 0)
        }
        gatewayStatus = 'ok'
        break
      }
    }
  }

  // ── Derive metrics ────────────────────────────────────────────────────────

  // Use lane task durations for performance (more reliable than session-derived)
  const allDurations = [
    ...taskDurations,
    ...Array.from(sessionMap.values())
      .filter((s) => s.durationMs !== undefined)
      .map((s) => s.durationMs!),
  ]

  const maxDurationMs = allDurations.length ? Math.max(...allDurations) : 0
  const avgDurationMs = allDurations.length
    ? allDurations.reduce((a, b) => a + b, 0) / allDurations.length
    : 0

  // Sessions sorted newest first
  const sessions = Array.from(sessionMap.values()).sort((a, b) => {
    const ta = a.queuedAt ?? a.processingAt ?? ''
    const tb = b.queuedAt ?? b.processingAt ?? ''
    return tb.localeCompare(ta)
  })

  // In-progress: has processing state but no completed
  const inProgress = sessions.filter((s) => s.processingAt && !s.completedAt).length

  // Gateway: if we saw lane activity, gateway is running
  if (gatewayStatus === 'unknown' && (laneEnqueues > 0 || laneTaskDone > 0 || laneTaskErrors > 0)) {
    gatewayStatus = 'ok'
  }

  const stats: AnalyticsStats = {
    windowMinutes,
    updatedAt: new Date().toISOString(),
    gatewayStatus,
    webhooksReceived,
    webhooksProcessed,
    webhookErrors,
    messagesQueued,
    messagesCompleted: messagesCompleted || laneTaskDone,
    messagesSkipped,
    messageErrors: messageErrors || laneTaskErrors,
    inProgress: inProgress || lastHeartbeatActive,
    waiting: lastHeartbeatWaiting,
    laneEnqueues,
    laneMaxWaitMs,
    maxDurationMs,
    avgDurationMs,
    stuckSessions,
    toolLoopWarnings,
    toolLoopBlocks,
    llmTimeouts,
    cronCount: 0,
    hasDebugLogs,
  }

  return { stats, sessions, logLinesScanned, laneErrors, laneTaskDones }
}
