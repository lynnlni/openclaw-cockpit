import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { detectEnvironmentScript } from '@/lib/deploy/scripts'
import { parseEnvironmentOutput } from '@/lib/deploy/installer'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string }>
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId } = await params
    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result

    const envResult = await exec(machine.id, sshConfig, detectEnvironmentScript())
    if (envResult.code !== 0) {
      return jsonError(`Environment detection failed: ${envResult.stderr}`, 500)
    }

    const env = parseEnvironmentOutput(envResult.stdout)

    return jsonSuccess({
      ...env,
      openclawPath: machine.openclawPath,
      raw: envResult.stdout,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Environment detection failed',
      500
    )
  }
}
