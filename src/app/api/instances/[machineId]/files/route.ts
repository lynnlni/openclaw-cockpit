import { NextRequest } from 'next/server'

import { listDir } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
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
    const workspace = getWorkspacePaths(machine.openclawPath)

    const recursive = request.nextUrl.searchParams.get('recursive') === 'true'
    const entries = await listDir(machine.id, sshConfig, workspace.path, recursive)

    return jsonSuccess(entries)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to list files',
      500
    )
  }
}
