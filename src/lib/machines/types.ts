export interface Machine {
  id: string
  name: string
  connectionType: 'ssh' | 'push'
  // SSH fields (required when connectionType='ssh')
  host?: string
  port?: number
  username?: string
  authType?: 'password' | 'privateKey'
  encryptedPassword?: string
  privateKeyPath?: string
  passphrase?: string
  // Push fields (used when connectionType='push')
  pushToken?: string
  pushRetainDays?: 1 | 2 | 3 | 7
  dashboardUrl?: string        // Dashboard 可达地址，嵌入 Skill 文件
  pushCronSchedule?: string    // 备份 cron 表达式，默认 "0 2 * * *"
  lastPushAt?: string
  lastPushVersion?: string
  openclawPath: string
  createdAt: string
  updatedAt: string
}

export interface MachineStatus {
  online: boolean
  openclawInstalled: boolean
  openclawRunning: boolean
  openclawVersion?: string
  nodeVersion?: string
  uptime?: number
}
