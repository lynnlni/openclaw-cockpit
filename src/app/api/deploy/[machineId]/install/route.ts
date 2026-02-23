import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { detectEnvironmentScript } from '@/lib/deploy/scripts'
import { parseEnvironmentOutput, getDeploySteps } from '@/lib/deploy/installer'
import type { DeployResult } from '@/lib/deploy/types'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string }>
}

export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId } = await params
    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result

    const envResult = await exec(machine.id, sshConfig, detectEnvironmentScript())
    if (envResult.code !== 0) {
      return jsonError(`Environment detection failed: ${envResult.stderr}`, 500)
    }

    const env = parseEnvironmentOutput(envResult.stdout)
    const steps = getDeploySteps({ ...env, openclawPath: machine.openclawPath })

    const results: DeployResult[] = []

    for (const step of steps) {
      const stepResult = await exec(machine.id, sshConfig, step.command)
      const deployResult: DeployResult = {
        success: stepResult.code === 0,
        step: step.id,
        output: stepResult.stdout,
        ...(stepResult.code !== 0 ? { error: stepResult.stderr } : {}),
      }
      results.push(deployResult)

      if (stepResult.code !== 0) {
        return jsonSuccess({ completed: false, results })
      }
    }

    return jsonSuccess({ completed: true, results })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Installation failed',
      500
    )
  }
}
