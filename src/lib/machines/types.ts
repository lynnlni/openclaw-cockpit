export interface Machine {
  id: string
  name: string
  host: string
  port: number
  username: string
  authType: 'password' | 'privateKey'
  encryptedPassword?: string
  privateKeyPath?: string
  passphrase?: string
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
