import { NextRequest } from 'next/server'

import { readFile, writeFile } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import { parseConfig, serializeConfig } from '@/lib/config/openclaw-config'
import type { OpenClawConfig } from '@/lib/config/types'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string }>
}

export interface DebugConfigState {
  debugLogs: boolean
  diagnosticsEnabled: boolean
}

function getDebugConfigState(config: OpenClawConfig): DebugConfigState {
  return {
    debugLogs: config.logging?.level === 'debug',
    diagnosticsEnabled: config.diagnostics?.enabled ?? false,
  }
}

function applyDebugConfigPatch(
  config: OpenClawConfig,
  patch: Partial<DebugConfigState>
): OpenClawConfig {
  return {
    ...config,
    logging: patch.debugLogs === undefined
      ? config.logging
      : {
          ...config.logging,
          level: patch.debugLogs ? 'debug' : 'info',
        },
    diagnostics: patch.diagnosticsEnabled === undefined
      ? config.diagnostics
      : {
          ...config.diagnostics,
          enabled: patch.diagnosticsEnabled,
        },
  }
}

function parsePatch(body: unknown): Partial<DebugConfigState> | null {
  if (!body || typeof body !== 'object') return null

  const patch: Partial<DebugConfigState> = {}
  const record = body as Record<string, unknown>

  if ('debugLogs' in record) {
    if (typeof record.debugLogs !== 'boolean') return null
    patch.debugLogs = record.debugLogs
  }

  if ('diagnosticsEnabled' in record) {
    if (typeof record.diagnosticsEnabled !== 'boolean') return null
    patch.diagnosticsEnabled = record.diagnosticsEnabled
  }

  return Object.keys(patch).length > 0 ? patch : null
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

    return jsonSuccess(getDebugConfigState(config))
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to read debug config',
      500
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId } = await params
    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const body: unknown = await request.json()
    const patch = parsePatch(body)
    if (!patch) {
      return jsonError('Request body must include debugLogs and/or diagnosticsEnabled booleans', 400)
    }

    const workspace = getWorkspacePaths(machine.openclawPath)
    const configJson = await readFile(machine.id, sshConfig, workspace.configPath)
    const config = parseConfig(configJson)
    const updatedConfig = applyDebugConfigPatch(config, patch)

    await writeFile(machine.id, sshConfig, workspace.configPath, serializeConfig(updatedConfig))

    return jsonSuccess(getDebugConfigState(updatedConfig))
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update debug config',
      500
    )
  }
}
