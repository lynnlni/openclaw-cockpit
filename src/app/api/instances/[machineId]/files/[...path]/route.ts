import { NextRequest } from 'next/server'
import { join } from 'path'

import { readFile, writeFile } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import {
  jsonSuccess,
  jsonError,
  resolveMachineWithSSH,
  isErrorResponse,
  containsTraversal,
} from '../../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string; path: string[] }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId, path: pathSegments } = await params

    if (containsTraversal(pathSegments)) {
      return jsonError('Path traversal is not allowed', 400)
    }

    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const workspace = getWorkspacePaths(machine.openclawPath)
    const filePath = join(workspace.path, ...pathSegments)

    const content = await readFile(machine.id, sshConfig, filePath)

    return jsonSuccess({ path: filePath, content })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to read file',
      500
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId, path: pathSegments } = await params

    if (containsTraversal(pathSegments)) {
      return jsonError('Path traversal is not allowed', 400)
    }

    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const workspace = getWorkspacePaths(machine.openclawPath)
    const filePath = join(workspace.path, ...pathSegments)

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || !('content' in body) || typeof (body as Record<string, unknown>).content !== 'string') {
      return jsonError('Request body must include a "content" string field', 400)
    }

    await writeFile(machine.id, sshConfig, filePath, (body as Record<string, unknown>).content as string)

    return jsonSuccess({ path: filePath, written: true })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to write file',
      500
    )
  }
}
