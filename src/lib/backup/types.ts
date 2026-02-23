export interface BackupSnapshot {
  name: string
  createdAt: string
  size: string
  path: string
  type: 'full' | 'workspace'
  machineName?: string
  machineHost?: string
}

export interface CloneRequest {
  sourceMachineId: string
  targetMachineId: string
  includeConfig: boolean
}
