export type MessageOutcome = 'completed' | 'skipped' | 'error'

export type SessionState = 'idle' | 'processing' | 'waiting'

export interface LogEvent {
  time: string
  level: string
  subsystem?: string
  message: string
  kv: Record<string, string | number>
}

// ── Error event detail (for drill-down) ──────────────────────────────────────

export interface LaneErrorEvent {
  time: string
  lane: string
  durationMs: number
  error: string
  isLLMTimeout: boolean
  sessionId?: string
}

export interface LaneTaskDoneEvent {
  time: string
  lane: string
  durationMs: number
  sessionId?: string
}

// ── Per-session timeline (time-point tracking) ───────────────────────────────

export interface TimelinePoint {
  event: string
  time: string
  offsetMs?: number
  detail?: string
}

export interface SessionTrace {
  sessionId: string
  sessionKey?: string
  channel?: string
  chatId?: string
  messageId?: string
  queuedAt?: string
  processingAt?: string
  completedAt?: string
  timeline: TimelinePoint[]
  waitMs?: number
  durationMs?: number
  totalMs?: number
  outcome?: MessageOutcome
  error?: string
  runAttempts: number
}

// ── Aggregate stats ───────────────────────────────────────────────────────────

export interface AnalyticsStats {
  windowMinutes: number
  updatedAt: string
  gatewayStatus: 'ok' | 'degraded' | 'unknown'
  webhooksReceived: number
  webhooksProcessed: number
  webhookErrors: number
  messagesQueued: number
  messagesCompleted: number
  messagesSkipped: number
  messageErrors: number
  inProgress: number
  waiting: number
  laneEnqueues: number
  laneMaxWaitMs: number
  maxDurationMs: number
  avgDurationMs: number
  stuckSessions: number
  toolLoopWarnings: number
  toolLoopBlocks: number
  llmTimeouts: number
  cronCount: number
  hasDebugLogs: boolean
}

export interface AnalyticsData {
  stats: AnalyticsStats
  sessions: SessionTrace[]
  logLinesScanned: number
  laneErrors: LaneErrorEvent[]
  laneTaskDones: LaneTaskDoneEvent[]
}
