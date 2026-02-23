import { NextRequest } from 'next/server'
import { z } from 'zod'

import { exec } from '@/lib/ssh/client'
import { getCloneExportCommand, getCloneImportCommand } from '@/lib/backup/cloner'
import { machineIdSchema } from '@/lib/validation/schemas'
import { getMachine, getDecryptedConfig } from '@/lib/machines/config'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

const cloneSchema = z.object({
  sourceMachineId: machineIdSchema,
})

interface RouteParams {
  params: Promise<{ machineId: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId: targetMachineId } = await params
    const targetResult = resolveMachineWithSSH(targetMachineId)
    if (isErrorResponse(targetResult)) return targetResult

    const body: unknown = await request.json()
    const parsed = cloneSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const sourceMachine = getMachine(parsed.data.sourceMachineId)
    if (!sourceMachine) {
      return jsonError('Source machine not found', 404)
    }

    const sourceSSH = getDecryptedConfig(sourceMachine)

    const exportResult = await exec(
      sourceMachine.id,
      sourceSSH,
      `${getCloneExportCommand(sourceMachine.openclawPath)} | base64`
    )

    if (exportResult.code !== 0) {
      return jsonError(`Export from source failed: ${exportResult.stderr}`, 500)
    }

    const { machine: targetMachine, sshConfig: targetSSH } = targetResult

    const importResult = await exec(
      targetMachine.id,
      targetSSH,
      `echo "${exportResult.stdout}" | base64 -d | ${getCloneImportCommand(targetMachine.openclawPath)}`
    )

    if (importResult.code !== 0) {
      return jsonError(`Import to target failed: ${importResult.stderr}`, 500)
    }

    return jsonSuccess({
      cloned: true,
      source: sourceMachine.id,
      target: targetMachine.id,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Clone failed',
      500
    )
  }
}
