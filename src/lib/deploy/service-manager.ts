import type { DeployEnvironment, ServiceStatus } from './types'

type DaemonType = DeployEnvironment['daemonType']

const SERVICE_NAME = 'openclaw'

export function getStatusCommand(daemonType: DaemonType): string {
  switch (daemonType) {
    case 'systemd':
      return `systemctl status ${SERVICE_NAME}`
    case 'pm2':
      return `pm2 describe ${SERVICE_NAME}`
    default:
      throw new Error(`Unsupported daemon type: ${daemonType}`)
  }
}

export function getStartCommand(daemonType: DaemonType, openclawPath: string): string {
  if (!openclawPath || openclawPath.trim().length === 0) {
    throw new Error('openclawPath must be a non-empty string')
  }

  switch (daemonType) {
    case 'systemd':
      return `systemctl start ${SERVICE_NAME}`
    case 'pm2':
      return `pm2 start ${openclawPath} --name ${SERVICE_NAME}`
    default:
      throw new Error(`Unsupported daemon type: ${daemonType}`)
  }
}

export function getStopCommand(daemonType: DaemonType): string {
  switch (daemonType) {
    case 'systemd':
      return `systemctl stop ${SERVICE_NAME}`
    case 'pm2':
      return `pm2 stop ${SERVICE_NAME}`
    default:
      throw new Error(`Unsupported daemon type: ${daemonType}`)
  }
}

export function getRestartCommand(daemonType: DaemonType): string {
  switch (daemonType) {
    case 'systemd':
      return `systemctl restart ${SERVICE_NAME}`
    case 'pm2':
      return `pm2 restart ${SERVICE_NAME}`
    default:
      throw new Error(`Unsupported daemon type: ${daemonType}`)
  }
}

export function getLogsCommand(daemonType: DaemonType, lines: number = 100): string {
  switch (daemonType) {
    case 'systemd':
      return `journalctl -u ${SERVICE_NAME} -n ${lines} --no-pager`
    case 'pm2':
      return `pm2 logs ${SERVICE_NAME} --lines ${lines} --nostream`
    default:
      throw new Error(`Unsupported daemon type: ${daemonType}`)
  }
}

export function parseServiceStatus(output: string, daemonType: DaemonType): ServiceStatus {
  switch (daemonType) {
    case 'systemd':
      return parseSystemdStatus(output)
    case 'pm2':
      return parsePm2Status(output)
    default:
      return { running: false }
  }
}

function parseSystemdStatus(output: string): ServiceStatus {
  const isRunning = output.includes('Active: active (running)')
  const pidMatch = output.match(/Main PID:\s*(\d+)/)
  const memoryMatch = output.match(/Memory:\s*(\S+)/)
  const uptimeMatch = output.match(/Active:.*?;\s*(.+?)(?:\n|$)/)

  return {
    running: isRunning,
    ...(pidMatch ? { pid: parseInt(pidMatch[1], 10) } : {}),
    ...(memoryMatch ? { memory: memoryMatch[1] } : {}),
    ...(uptimeMatch && isRunning ? { uptime: uptimeMatch[1].trim() } : {}),
  }
}

function parsePm2Status(output: string): ServiceStatus {
  const isRunning = output.includes('status') && output.includes('online')
  const pidMatch = output.match(/pid\s*[│|]\s*(\d+)/)
  const memoryMatch = output.match(/memory\s*[│|]\s*(\S+)/)
  const uptimeMatch = output.match(/uptime\s*[│|]\s*(\S+)/)
  const cpuMatch = output.match(/cpu\s*[│|]\s*(\S+)/)

  return {
    running: isRunning,
    ...(pidMatch ? { pid: parseInt(pidMatch[1], 10) } : {}),
    ...(memoryMatch ? { memory: memoryMatch[1] } : {}),
    ...(uptimeMatch ? { uptime: uptimeMatch[1] } : {}),
    ...(cpuMatch ? { cpu: cpuMatch[1] } : {}),
  }
}
