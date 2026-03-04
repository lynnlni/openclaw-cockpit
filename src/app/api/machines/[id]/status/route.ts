import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { detectEnvironmentScript } from '@/lib/deploy/scripts'
import { parseEnvironmentOutput } from '@/lib/deploy/installer'
import type { MachineStatus } from '@/lib/machines/types'
import { jsonSuccess, jsonError, resolveMachine, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params

    // Resolve machine first to check connection type
    const machine = resolveMachine(id)
    if (isErrorResponse(machine)) return machine

    // Push machines don't support SSH status polling — derive status from push metadata
    if (machine.connectionType === 'push') {
      const status: MachineStatus = {
        online: Boolean(machine.lastPushAt),
        openclawInstalled: Boolean(machine.lastPushAt),
        openclawRunning: false,
        openclawVersion: machine.lastPushVersion,
      }
      return jsonSuccess(status)
    }

    const result = resolveMachineWithSSH(id)
    if (isErrorResponse(result)) return result

    const { sshConfig } = result

    const envResult = await exec(machine.id, sshConfig, detectEnvironmentScript())

    if (envResult.code !== 0) {
      const status: MachineStatus = {
        online: false,
        openclawInstalled: false,
        openclawRunning: false,
      }
      return jsonSuccess(status)
    }

    const env = parseEnvironmentOutput(envResult.stdout)

    const isRunning = (await exec(machine.id, sshConfig, `pgrep -f openclaw`)).code === 0

    const status: MachineStatus = {
      online: true,
      openclawInstalled: env.openclawVersion !== null,
      openclawRunning: isRunning,
      openclawVersion: env.openclawVersion ?? undefined,
      nodeVersion: env.nodeVersion ?? undefined,
    }

    return jsonSuccess(status)
  } catch (error) {
    const status: MachineStatus = {
      online: false,
      openclawInstalled: false,
      openclawRunning: false,
    }
    return jsonSuccess(status)
  }
}
