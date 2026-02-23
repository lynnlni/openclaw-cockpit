import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { uninstallOpenclawScript } from '@/lib/deploy/scripts'
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

    const uninstallResult = await exec(machine.id, sshConfig, uninstallOpenclawScript())

    if (uninstallResult.code !== 0) {
      return jsonError(`Uninstall failed: ${uninstallResult.stderr}`, 500)
    }

    return jsonSuccess({
      uninstalled: true,
      output: uninstallResult.stdout,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Uninstall failed',
      500
    )
  }
}
