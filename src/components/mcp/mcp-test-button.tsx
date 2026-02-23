'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, Plug } from 'lucide-react'
import { cn } from '@/lib/utils'

interface McpTestButtonProps {
  name: string
}

type TestState = 'idle' | 'loading' | 'success' | 'error'

export function McpTestButton({ name }: McpTestButtonProps) {
  const [state, setState] = useState<TestState>('idle')

  const handleTest = useCallback(async () => {
    setState('loading')
    try {
      const res = await fetch(`/api/mcp/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      setState(res.ok ? 'success' : 'error')
    } catch {
      setState('error')
    }
  }, [name])

  const icon = {
    idle: <Plug className="h-3.5 w-3.5" />,
    loading: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    success: <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />,
    error: <XCircle className="h-3.5 w-3.5 text-destructive" />,
  }[state]

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleTest}
      disabled={state === 'loading'}
      title="测试连接"
    >
      {icon}
    </Button>
  )
}
