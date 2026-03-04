'use client'

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import { Loader2, Terminal, Trash2, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { Machine } from '@/lib/machines/types'

interface SshConsoleDialogProps {
  open: boolean
  machine: Machine
  onClose: () => void
}

interface OutputLine {
  id: number
  type: 'input' | 'stdout' | 'stderr' | 'info'
  text: string
}

let lineCounter = 0

function nextId() {
  return ++lineCounter
}

export function SshConsoleDialog({ open, machine, onClose }: SshConsoleDialogProps) {
  const [lines, setLines] = useState<OutputLine[]>([
    { id: nextId(), type: 'info', text: `已连接至 ${machine.host}:${machine.port}（${machine.username}）` },
  ])
  const [input, setInput] = useState('')
  const [running, setRunning] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIdx, setHistoryIdx] = useState(-1)

  const outputRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll output to bottom on new lines
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const appendLines = useCallback((newLines: OutputLine[]) => {
    setLines((prev) => [...prev, ...newLines])
  }, [])

  const handleRun = useCallback(async () => {
    const cmd = input.trim()
    if (!cmd || running) return

    setInput('')
    setHistoryIdx(-1)
    setHistory((prev) => [cmd, ...prev].slice(0, 100))
    setRunning(true)

    appendLines([{ id: nextId(), type: 'input', text: `$ ${cmd}` }])

    try {
      const res = await fetch(`/api/machines/${machine.id}/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      })
      const body = await res.json()

      if (!res.ok) {
        appendLines([{ id: nextId(), type: 'stderr', text: body.error ?? '执行失败' }])
      } else {
        const toAdd: OutputLine[] = []
        if (body.data?.stdout) {
          body.data.stdout.split('\n').forEach((line: string) => {
            toAdd.push({ id: nextId(), type: 'stdout', text: line })
          })
        }
        if (body.data?.stderr) {
          body.data.stderr.split('\n').forEach((line: string) => {
            toAdd.push({ id: nextId(), type: 'stderr', text: line })
          })
        }
        if (toAdd.length === 0) {
          toAdd.push({ id: nextId(), type: 'info', text: `退出码: ${body.data?.code ?? 0}` })
        }
        appendLines(toAdd)
      }
    } catch {
      appendLines([{ id: nextId(), type: 'stderr', text: '请求失败' }])
    } finally {
      setRunning(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, running, machine.id, appendLines])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRun()
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHistoryIdx((idx) => {
        const next = Math.min(idx + 1, history.length - 1)
        setInput(history[next] ?? '')
        return next
      })
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHistoryIdx((idx) => {
        const next = Math.max(idx - 1, -1)
        setInput(next === -1 ? '' : (history[next] ?? ''))
        return next
      })
    }
  }, [handleRun, history])

  const handleClear = useCallback(() => {
    setLines([{ id: nextId(), type: 'info', text: `已连接至 ${machine.host}:${machine.port}（${machine.username}）` }])
  }, [machine.host, machine.port, machine.username])

  const handleOpenChange = useCallback((v: boolean) => {
    if (!v) onClose()
  }, [onClose])

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-4xl p-0 overflow-hidden">
        {/* Title bar */}
        <AlertDialogHeader className="flex flex-row items-center justify-between px-4 py-3 border-b border-border">
          <AlertDialogTitle className="flex items-center gap-2 text-sm font-medium">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            {machine.name}
            <span className="text-xs text-muted-foreground font-normal">
              {machine.host}:{machine.port}
            </span>
          </AlertDialogTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleClear}
              title="清空输出"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={onClose} title="关闭">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        </AlertDialogHeader>

        {/* Output area */}
        <div
          ref={outputRef}
          className="h-[520px] overflow-y-auto bg-[#0d0d0d] px-4 py-3 font-mono text-xs leading-5"
        >
          {lines.map((line) => (
            <div
              key={line.id}
              className={
                line.type === 'input'
                  ? 'text-sky-400'
                  : line.type === 'stderr'
                  ? 'text-red-400'
                  : line.type === 'info'
                  ? 'text-muted-foreground/60'
                  : 'text-foreground'
              }
            >
              {line.text || '\u00a0'}
            </div>
          ))}
          {running && (
            <div className="flex items-center gap-1.5 text-muted-foreground/50">
              <Loader2 className="h-3 w-3 animate-spin" />
              执行中…
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 border-t border-border bg-[#0d0d0d] px-4 py-2">
          <span className="font-mono text-xs text-sky-400 select-none">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={running}
            placeholder="输入命令…"
            className="flex-1 bg-transparent font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/30 disabled:opacity-50"
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={handleRun}
            disabled={running || !input.trim()}
          >
            运行
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
