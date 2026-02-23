import { NextRequest } from 'next/server'
import { z } from 'zod'

import { exec } from '@/lib/ssh/client'
import { detectEnvironmentScript } from '@/lib/deploy/scripts'
import { parseEnvironmentOutput } from '@/lib/deploy/installer'
import {
  getStartCommand,
  getStopCommand,
  getRestartCommand,
  parseServiceStatus,
} from '@/lib/deploy/service-manager'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

const serviceActionSchema = z.object({
  action: z.enum(['start', 'stop', 'restart']),
})

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

    const body: unknown = await request.json()
    const parsed = serviceActionSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(
        parsed.error.issues[0]?.message ?? 'Invalid action',
        400
      )
    }

    const envResult = await exec(machine.id, sshConfig, detectEnvironmentScript())
    if (envResult.code !== 0) {
      return jsonError('Failed to detect environment', 500)
    }

    const env = parseEnvironmentOutput(envResult.stdout)

    if (env.daemonType === 'none') {
      return jsonError('No supported daemon found (systemd or pm2 required)', 400)
    }

    let command: string
    switch (parsed.data.action) {
      case 'start':
        command = getStartCommand(env.daemonType, machine.openclawPath)
        break
      case 'stop':
        command = getStopCommand(env.daemonType)
        break
      case 'restart':
        command = getRestartCommand(env.daemonType)
        break
    }

    const actionResult = await exec(machine.id, sshConfig, command)

    if (actionResult.code !== 0) {
      return jsonError(
        `Service ${parsed.data.action} failed: ${actionResult.stderr}`,
        500
      )
    }

    return jsonSuccess({
      action: parsed.data.action,
      output: actionResult.stdout,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Service action failed',
      500
    )
  }
}
