import type { DeployEnvironment, DeployStep } from './types'
import {
  installNodeScript,
  installOpenclawScript,
  initWorkspaceScript,
} from './scripts'

const NODE_MIN_MAJOR = 22
const DEFAULT_NODE_VERSION = '22'
const DEFAULT_OPENCLAW_PATH = '~/.openclaw'

export function getDeploySteps(env: DeployEnvironment): ReadonlyArray<DeployStep> {
  const steps: DeployStep[] = []

  if (!hasMinimumNodeVersion(env.nodeVersion)) {
    steps.push({
      id: 'install-node',
      label: 'Install Node.js',
      command: installNodeScript(DEFAULT_NODE_VERSION),
      description: `Install Node.js v${DEFAULT_NODE_VERSION} via NVM`,
    })
  }

  if (!env.openclawVersion) {
    steps.push({
      id: 'install-openclaw',
      label: 'Install OpenClaw',
      command: installOpenclawScript(),
      description: 'Install OpenClaw globally via npm',
    })
  }

  const workspacePath = env.openclawPath || DEFAULT_OPENCLAW_PATH
  steps.push({
    id: 'init-workspace',
    label: 'Initialize Workspace',
    command: initWorkspaceScript(workspacePath),
    description: `Create workspace directories at ${workspacePath}`,
  })

  return steps
}

export function parseEnvironmentOutput(stdout: string): DeployEnvironment {
  const lines = stdout.split('\n')
  const values = extractKeyValues(lines)

  return {
    os: parseOs(values.OS),
    arch: values.ARCH || 'unknown',
    packageManager: parsePackageManager(values.PKG),
    nodeVersion: parseOptionalValue(values.NODE_VERSION),
    npmVersion: parseOptionalValue(values.NPM_VERSION),
    openclawVersion: parseOptionalValue(values.OPENCLAW_VERSION),
    openclawPath: values.OPENCLAW_PATH === 'none' ? DEFAULT_OPENCLAW_PATH : (values.OPENCLAW_PATH || DEFAULT_OPENCLAW_PATH),
    daemonType: parseDaemonType(values.DAEMON),
  }
}

function extractKeyValues(lines: ReadonlyArray<string>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of lines) {
    const eqIndex = line.indexOf('=')
    if (eqIndex > 0) {
      const key = line.slice(0, eqIndex).trim()
      const value = line.slice(eqIndex + 1).trim()
      result[key] = value
    }
  }
  return result
}

function parseOs(value: string | undefined): DeployEnvironment['os'] {
  if (!value) return 'unknown'
  const lower = value.toLowerCase()
  if (lower === 'linux') return 'linux'
  if (lower === 'darwin') return 'darwin'
  return 'unknown'
}

function parsePackageManager(value: string | undefined): DeployEnvironment['packageManager'] {
  const valid = ['apt', 'yum', 'dnf', 'brew'] as const
  if (value && (valid as ReadonlyArray<string>).includes(value)) {
    return value as DeployEnvironment['packageManager']
  }
  return 'unknown'
}

function parseDaemonType(value: string | undefined): DeployEnvironment['daemonType'] {
  if (value === 'systemd') return 'systemd'
  if (value === 'pm2') return 'pm2'
  return 'none'
}

function parseOptionalValue(value: string | undefined): string | null {
  if (!value || value === 'none') return null
  return value
}

function hasMinimumNodeVersion(version: string | null): boolean {
  if (!version) return false
  const cleaned = version.startsWith('v') ? version.slice(1) : version
  const major = parseInt(cleaned.split('.')[0], 10)
  return !isNaN(major) && major >= NODE_MIN_MAJOR
}
