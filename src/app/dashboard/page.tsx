'use client'

import { useMachines } from '@/hooks/use-machines'
import { useMachineStatus } from '@/hooks/use-machine-status'
import { MachineCard } from '@/components/dashboard/machine-card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { LayoutDashboard } from 'lucide-react'

function MachineCardWithStatus({ machine }: { machine: import('@/lib/machines/types').Machine }) {
  const { data: status, isLoading } = useMachineStatus(machine.id)

  return (
    <MachineCard
      machine={machine}
      status={status}
      statusLoading={isLoading}
    />
  )
}

export default function DashboardPage() {
  const { data: machines, isLoading, error } = useMachines()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner text="加载中..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-destructive">加载失败: {error.message}</p>
      </div>
    )
  }

  if (!machines || machines.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <LayoutDashboard className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">暂无机器，请先添加机器</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">仪表盘</h1>
        <p className="text-sm text-muted-foreground">机器状态总览</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {machines.map((machine) => (
          <MachineCardWithStatus key={machine.id} machine={machine} />
        ))}
      </div>
    </div>
  )
}
