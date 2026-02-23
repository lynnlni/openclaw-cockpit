'use client'

import { useEffect } from 'react'
import { useMachine } from '@/store/machine-context'
import { useMachines } from '@/hooks/use-machines'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Server } from 'lucide-react'

export function MachineSwitcher() {
  const { selectedMachineId, setSelectedMachineId } = useMachine()
  const { data: machines } = useMachines()

  // Auto-select the first machine if none selected and machines exist
  useEffect(() => {
    if (!selectedMachineId && machines && machines.length > 0) {
      setSelectedMachineId(machines[0].id)
    }
  }, [selectedMachineId, machines, setSelectedMachineId])

  // Clear selection if selected machine was removed
  useEffect(() => {
    if (selectedMachineId && machines && machines.length > 0) {
      const exists = machines.some((m) => m.id === selectedMachineId)
      if (!exists) {
        setSelectedMachineId(machines[0].id)
      }
    }
  }, [selectedMachineId, machines, setSelectedMachineId])

  return (
    <div className="px-3 py-2">
      <Select
        value={selectedMachineId ?? ''}
        onValueChange={(value) => setSelectedMachineId(value || null)}
      >
        <SelectTrigger className="w-full bg-secondary/50 border-border">
          <div className="flex items-center gap-2 truncate">
            <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
            <SelectValue placeholder="未选择机器" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {(!machines || machines.length === 0) && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              暂无机器，请先在机器管理中添加
            </div>
          )}
          {machines?.map((machine) => (
            <SelectItem key={machine.id} value={machine.id}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span className="truncate">{machine.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
