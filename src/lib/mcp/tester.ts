import type { MCPServerConfig } from '../config/types'
import type { MCPTestResult } from './types'

export function getTestCommand(server: MCPServerConfig): string {
  switch (server.transport) {
    case 'stdio':
      return `which ${server.command ?? 'unknown'} && echo "REACHABLE" || echo "NOT_FOUND"`
    case 'http':
    case 'sse':
      return `curl -sf -o /dev/null -w "%{http_code} %{time_total}" --max-time 10 "${server.url ?? ''}"`
    default:
      throw new Error(`Unknown transport type`)
  }
}

export function parseTestResult(
  output: string,
  exitCode: number
): MCPTestResult {
  if (exitCode !== 0) {
    return {
      success: false,
      message: `Connection failed (exit code ${exitCode})`,
    }
  }

  if (output.includes('REACHABLE')) {
    return {
      success: true,
      message: 'Command found and reachable',
    }
  }

  if (output.includes('NOT_FOUND')) {
    return {
      success: false,
      message: 'Command not found on system',
    }
  }

  const parts = output.trim().split(/\s+/)
  const statusCode = parseInt(parts[0] ?? '', 10)
  const responseTime = parseFloat(parts[1] ?? '')

  if (isNaN(statusCode)) {
    return {
      success: false,
      message: `Unexpected response: ${output.trim()}`,
    }
  }

  return {
    success: statusCode >= 200 && statusCode < 400,
    message: `HTTP ${statusCode}`,
    responseTime: isNaN(responseTime) ? undefined : responseTime * 1000,
  }
}
