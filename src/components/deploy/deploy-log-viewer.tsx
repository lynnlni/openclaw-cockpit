'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface DeployLogViewerProps {
  logs: string[]
  className?: string
}

export function DeployLogViewer({ logs, className }: DeployLogViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs.length])

  return (
    <div
      className={cn(
        'max-h-64 overflow-y-auto rounded-lg border border-border bg-zinc-950 p-4',
        className,
      )}
    >
      <pre className="font-mono text-xs leading-relaxed text-zinc-300">
        {logs.map((line, i) => (
          <div
            key={`${i}-${line.slice(0, 20)}`}
            className={cn(
              line.startsWith('[错误]') && 'text-red-400',
              line.startsWith('[警告]') && 'text-yellow-400',
            )}
          >
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </pre>
    </div>
  )
}
