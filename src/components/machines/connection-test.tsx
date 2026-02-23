'use client'

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plug, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ConnectionTestProps {
  machineId: string
  testing: boolean
  onTestStart: () => void
  onTestEnd: () => void
}

type TestResult = 'idle' | 'loading' | 'success' | 'error'

export function ConnectionTest({
  machineId,
  testing,
  onTestStart,
  onTestEnd,
}: ConnectionTestProps) {
  const [result, setResult] = useState<TestResult>('idle')
  const [message, setMessage] = useState('')

  const handleTest = useCallback(async () => {
    if (testing) return
    onTestStart()
    setResult('loading')
    setMessage('')

    try {
      const res = await fetch(`/api/machines/${machineId}/test`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setResult('success')
        setMessage('连接成功')
      } else {
        setResult('error')
        setMessage(data.error ?? '连接失败')
      }
    } catch {
      setResult('error')
      setMessage('请求失败')
    } finally {
      onTestEnd()
    }
  }, [machineId, testing, onTestStart, onTestEnd])

  const icon = {
    idle: <Plug className="h-3.5 w-3.5" />,
    loading: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    success: <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />,
    error: <XCircle className="h-3.5 w-3.5 text-destructive" />,
  }[result]

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleTest}
        disabled={testing}
        title="测试连接"
      >
        {icon}
      </Button>
      {message && (
        <span
          className={cn(
            'text-xs',
            result === 'success' ? 'text-emerald-400' : 'text-destructive',
          )}
        >
          {message}
        </span>
      )}
    </div>
  )
}
