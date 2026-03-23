import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { detectEnvironmentScript } from '@/lib/deploy/scripts'
import { parseEnvironmentOutput } from '@/lib/deploy/installer'
import { getLogsCommand } from '@/lib/deploy/service-manager'
import { parseLogs } from '@/lib/analytics/log-parser'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string }>
}

function clampWindowMinutes(value: string | null): number {
  const parsed = value ? Number.parseInt(value, 10) : 180
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) return 180
  return Math.min(Math.max(parsed, 1), 1440)
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId } = await params
    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const windowMinutes = clampWindowMinutes(request.nextUrl.searchParams.get('window'))

    const envResult = await exec(machine.id, sshConfig, detectEnvironmentScript())
    if (envResult.code !== 0) {
      return jsonError('Failed to detect environment', 500)
    }

    const env = parseEnvironmentOutput(envResult.stdout)
    if (env.daemonType === 'none') {
      return jsonError('No supported daemon found', 400)
    }

    const lines = Math.min(Math.max(windowMinutes * 25, 200), 2000)
    const logsResult = await exec(machine.id, sshConfig, getLogsCommand(env.daemonType, lines))
    if (logsResult.code !== 0) {
      return jsonError(
        logsResult.stderr || 'Failed to retrieve logs',
        500
      )
    }

    return jsonSuccess(parseLogs(logsResult.stdout, windowMinutes))
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to load analytics',
      500
    )
  }
}
