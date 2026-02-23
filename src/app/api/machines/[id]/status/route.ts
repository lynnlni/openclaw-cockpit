import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { detectEnvironmentScript } from '@/lib/deploy/scripts'
import { parseEnvironmentOutput } from '@/lib/deploy/installer'
import type { MachineStatus } from '@/lib/machines/types'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params
    const result = resolveMachineWithSSH(id)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result

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

    const isRunning = env.daemonType !== 'none'
      ? (await exec(machine.id, sshConfig, `pgrep -f openclaw`)).code === 0
      : false

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
