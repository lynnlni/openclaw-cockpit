import { NextRequest } from 'next/server'

import { readFile, writeFile } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import { parseConfig, serializeConfig } from '@/lib/config/openclaw-config'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId } = await params
    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const workspace = getWorkspacePaths(machine.openclawPath)
    const configJson = await readFile(machine.id, sshConfig, workspace.configPath)
    const config = parseConfig(configJson)

    return jsonSuccess(config)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to get config',
      500
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId } = await params
    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') {
      return jsonError('Invalid config object', 400)
    }

    const workspace = getWorkspacePaths(machine.openclawPath)
    const configJson = serializeConfig(body as Parameters<typeof serializeConfig>[0])
    await writeFile(machine.id, sshConfig, workspace.configPath, configJson)

    return jsonSuccess({ updated: true })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update config',
      500
    )
  }
}
