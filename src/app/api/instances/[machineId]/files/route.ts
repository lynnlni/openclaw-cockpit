import { NextRequest } from 'next/server'
import { join } from 'path'

import { listDir } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import {
  jsonSuccess,
  jsonError,
  resolveMachineWithSSH,
  isErrorResponse,
  containsTraversal,
} from '../../../_helpers'

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
    const requestedPath = request.nextUrl.searchParams.get('path')
    const exclude = request.nextUrl.searchParams.get('exclude')?.split(',').filter(Boolean) ?? []

    if (requestedPath) {
      const segments = requestedPath.split('/').filter(Boolean)
      if (containsTraversal(segments)) {
        return jsonError('Path traversal is not allowed', 400)
      }
    }

    const targetPath = requestedPath
      ? requestedPath.startsWith('/')
        ? requestedPath
        : join(workspace.path, requestedPath)
      : workspace.path

    const recursive = request.nextUrl.searchParams.get('recursive') === 'true'
    const entries = await listDir(machine.id, sshConfig, targetPath, recursive, exclude)

    return jsonSuccess(entries)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to list files',
      500
    )
  }
}
