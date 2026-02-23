import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { initWorkspaceScript } from '@/lib/deploy/scripts'
import { writeFile } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import { serializeConfig } from '@/lib/config/openclaw-config'
import type { OpenClawConfig } from '@/lib/config/types'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string }>
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

    const initResult = await exec(
      machine.id,
      sshConfig,
      initWorkspaceScript(machine.openclawPath)
    )

    if (initResult.code !== 0) {
      return jsonError(`Workspace init failed: ${initResult.stderr}`, 500)
    }

    const body: unknown = await request.json().catch(() => null)

    if (body && typeof body === 'object') {
      const workspace = getWorkspacePaths(machine.openclawPath)
      const configJson = serializeConfig(body as OpenClawConfig)
      await writeFile(machine.id, sshConfig, workspace.configPath, configJson)
    }

    return jsonSuccess({
      initialized: true,
      path: machine.openclawPath,
      output: initResult.stdout,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Initialization failed',
      500
    )
  }
}
