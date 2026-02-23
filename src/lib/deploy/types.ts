export interface DeployEnvironment {
  os: 'linux' | 'darwin' | 'unknown'
  arch: string
  packageManager: 'apt' | 'yum' | 'dnf' | 'brew' | 'unknown'
  nodeVersion: string | null
  npmVersion: string | null
  openclawVersion: string | null
  openclawPath: string
  daemonType: 'systemd' | 'pm2' | 'none'
}

export interface DeployStep {
  id: string
  label: string
  command: string
  description: string
}

export interface DeployResult {
  success: boolean
  step: string
  output: string
  error?: string
}

export interface ServiceStatus {
  running: boolean
  pid?: number
  uptime?: string
  memory?: string
  cpu?: string
}

export interface VersionInfo {
  current: string | null
  latest: string | null
  updateAvailable: boolean
}
