'use client'

import { useState } from 'react'
import type { Machine } from '@/lib/machines/types'
import { Button } from '@/components/ui/button'
import { ConnectionTest } from '@/components/machines/connection-test'
import { Pencil, Trash2, Server } from 'lucide-react'

interface MachineListProps {
  machines: Machine[]
  onEdit: (machine: Machine) => void
  onDelete: (machine: Machine) => void
}

export function MachineList({ machines, onEdit, onDelete }: MachineListProps) {
  const [testingId, setTestingId] = useState<string | null>(null)

  if (machines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12">
        <Server className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">暂无机器，请添加</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">名称</th>
            <th className="px-4 py-3 font-medium">主机</th>
            <th className="px-4 py-3 font-medium">端口</th>
            <th className="px-4 py-3 font-medium">用户名</th>
            <th className="px-4 py-3 font-medium">认证方式</th>
            <th className="px-4 py-3 font-medium text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((machine) => (
            <tr
              key={machine.id}
              className="border-b border-border last:border-b-0 hover:bg-muted/30"
            >
              <td className="px-4 py-3 text-sm font-medium text-foreground">
                {machine.name}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {machine.host}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {machine.port}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {machine.username}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {machine.authType === 'password' ? '密码' : '密钥'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <ConnectionTest
                    machineId={machine.id}
                    testing={testingId === machine.id}
                    onTestStart={() => setTestingId(machine.id)}
                    onTestEnd={() => setTestingId(null)}
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onEdit(machine)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDelete(machine)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
