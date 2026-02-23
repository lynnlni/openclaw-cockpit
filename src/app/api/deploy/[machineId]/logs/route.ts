import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { detectEnvironmentScript } from '@/lib/deploy/scripts'
import { parseEnvironmentOutput } from '@/lib/deploy/installer'
import { getLogsCommand } from '@/lib/deploy/service-manager'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string }>
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

    const linesParam = request.nextUrl.searchParams.get('lines')
    const lines = linesParam ? Math.min(Math.max(parseInt(linesParam, 10) || 100, 1), 1000) : 100

    const envResult = await exec(machine.id, sshConfig, detectEnvironmentScript())
    if (envResult.code !== 0) {
      return jsonError('Failed to detect environment', 500)
    }

    const env = parseEnvironmentOutput(envResult.stdout)

    if (env.daemonType === 'none') {
      return jsonError('No supported daemon found', 400)
    }

    const logsResult = await exec(
      machine.id,
      sshConfig,
      getLogsCommand(env.daemonType, lines)
    )

    return jsonSuccess({
      logs: logsResult.stdout,
      stderr: logsResult.stderr || undefined,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to retrieve logs',
      500
    )
  }
}
