import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { upgradeOpenclawScript } from '@/lib/deploy/scripts'
import { getLocalVersionCommand, getLatestVersionCommand, parseVersions } from '@/lib/deploy/version-checker'
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

    const [localResult, latestResult] = await Promise.all([
      exec(machine.id, sshConfig, getLocalVersionCommand()),
      exec(machine.id, sshConfig, getLatestVersionCommand()),
    ])

    const versions = parseVersions(localResult.stdout, latestResult.stdout)

    if (!versions.updateAvailable) {
      return jsonSuccess({
        upgraded: false,
        message: 'Already on the latest version',
        versions,
      })
    }

    const upgradeResult = await exec(machine.id, sshConfig, upgradeOpenclawScript())

    if (upgradeResult.code !== 0) {
      return jsonError(`Upgrade failed: ${upgradeResult.stderr}`, 500)
    }

    const newLocalResult = await exec(machine.id, sshConfig, getLocalVersionCommand())
    const newVersions = parseVersions(newLocalResult.stdout, latestResult.stdout)

    return jsonSuccess({
      upgraded: true,
      versions: newVersions,
      output: upgradeResult.stdout,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Upgrade failed',
      500
    )
  }
}
