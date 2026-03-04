export interface BackupSnapshot {
  name: string
  createdAt: string
  size: string
  path: string
  type: 'full' | 'workspace'
  source?: 'ssh' | 'push'
  machineName?: string
  machineHost?: string
}

export interface CloneRequest {
  sourceMachineId: string
  targetMachineId: string
  includeConfig: boolean
}

export interface PendingRestore {
  snapshotName: string
  requestedAt: string
}
