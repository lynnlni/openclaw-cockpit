'use client'

import { usePathname } from 'next/navigation'
import { useMachine } from '@/store/machine-context'
import { useMachines } from '@/hooks/use-machines'
import { Badge } from '@/components/ui/badge'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/machines': '机器管理',
  '/deploy': '部署管理',
  '/workspace/config': '核心配置',
  '/workspace/identity': '身份信息',
  '/workspace/soul': '性格设定',
  '/workspace/memory-index': '记忆索引',
  '/workspace/daily-memory': '每日记忆',
  '/workspace/user': '用户档案',
  '/workspace/agents': 'Agent 配置',
  '/workspace/tools': '工具配置',
  '/workspace/bootstrap': '启动引导',
  '/workspace/heartbeat': '心跳配置',
  '/skills': '技能管理',
  '/backups': '备份恢复',
}

export function Header() {
  const pathname = usePathname()
  const { selectedMachineId } = useMachine()
  const { data: machines } = useMachines()

  const currentLabel = ROUTE_LABELS[pathname] ?? ''
  const machine = selectedMachineId
    ? machines?.find((m) => m.id === selectedMachineId)
    : null

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Cockpit</span>
        {currentLabel && (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium text-foreground">{currentLabel}</span>
          </>
        )}
      </div>

      {machine && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{machine.name}</span>
          <Badge
            variant="default"
            className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15"
          >
            已纳管
          </Badge>
        </div>
      )}
    </header>
  )
}
