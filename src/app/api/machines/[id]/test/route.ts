import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params
    const result = resolveMachineWithSSH(id)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const execResult = await exec(machine.id, sshConfig, 'echo "connected"')

    if (execResult.code !== 0) {
      return jsonSuccess({
        connected: false,
        error: execResult.stderr,
      })
    }

    return jsonSuccess({ connected: true })
  } catch (error) {
    return jsonSuccess({
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    })
  }
}
