'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useDebugConfig } from '@/hooks/use-debug-config'
import { Loader2 } from 'lucide-react'

interface ToggleSwitchProps {
  checked: boolean
  disabled: boolean
  onChange: (val: boolean) => void
}

function ToggleSwitch({ checked, disabled, onChange }: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none',
        checked ? 'bg-emerald-500' : 'bg-muted',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={cn(
          'block h-3 w-3 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-3.5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

interface Props {
  machineId: string
}

export function DebugToggle({ machineId }: Props) {
  const { data, isLoading, toggle } = useDebugConfig(machineId)
  const [pending, setPending] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  const handleToggle = async (key: 'debugLogs' | 'diagnosticsEnabled', value: boolean) => {
    setPending(key)
    setLastError(null)
    try {
      await toggle({ [key]: value })
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setPending(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>读取配置...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {lastError && (
        <span className="max-w-xs truncate text-[10px] text-red-400">{lastError}</span>
      )}

      {/* Debug Logs toggle */}
      <div className="flex items-center gap-1.5">
        {pending === 'debugLogs' ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : (
          <ToggleSwitch
            checked={data?.debugLogs ?? false}
            disabled={pending !== null}
            onChange={(val) => handleToggle('debugLogs', val)}
          />
        )}
        <span
          className={cn(
            'text-[10px]',
            data?.debugLogs ? 'text-emerald-400' : 'text-muted-foreground',
          )}
        >
          Debug 日志
        </span>
      </div>

      <div className="h-3 w-px bg-border" />

      {/* Diagnostics toggle */}
      <div className="flex items-center gap-1.5">
        {pending === 'diagnosticsEnabled' ? (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        ) : (
          <ToggleSwitch
            checked={data?.diagnosticsEnabled ?? false}
            disabled={pending !== null}
            onChange={(val) => handleToggle('diagnosticsEnabled', val)}
          />
        )}
        <span
          className={cn(
            'text-[10px]',
            data?.diagnosticsEnabled ? 'text-emerald-400' : 'text-muted-foreground',
          )}
        >
          诊断追踪
        </span>
      </div>
    </div>
  )
}
