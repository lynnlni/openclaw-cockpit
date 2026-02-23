import { NextRequest } from 'next/server'

import { readFile, writeFile } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import {
  parseConfig,
  serializeConfig,
  getProviders,
  setProviders,
} from '@/lib/config/openclaw-config'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../../_helpers'

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
    const providers = getProviders(config)

    return jsonSuccess(providers)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to get providers',
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
      return jsonError('Invalid providers object', 400)
    }

    const workspace = getWorkspacePaths(machine.openclawPath)
    const configJson = await readFile(machine.id, sshConfig, workspace.configPath)
    const config = parseConfig(configJson)
    const updated = setProviders(config, body as Parameters<typeof setProviders>[1])
    await writeFile(machine.id, sshConfig, workspace.configPath, serializeConfig(updated))

    return jsonSuccess({ updated: true })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update providers',
      500
    )
  }
}
