import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { shellEscapePath } from '@/lib/ssh/shell-escape'
import { getSnapshotDir } from '@/lib/backup/exporter'
import { getDeleteSnapshotCommand } from '@/lib/backup/snapshot'
import { snapshotNameSchema } from '@/lib/validation/schemas'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string; name: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId, name } = await params

    const nameResult = snapshotNameSchema.safeParse(name)
    if (!nameResult.success) {
      return jsonError('Invalid snapshot name', 400)
    }

    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const backupsDir = getSnapshotDir(machine.openclawPath)
    const snapshotPath = `${backupsDir}/${nameResult.data}.tar.gz`

    const sizeResult = await exec(
      machine.id,
      sshConfig,
      `stat -c '%s' ${shellEscapePath(snapshotPath)} 2>/dev/null || stat -f '%z' ${shellEscapePath(snapshotPath)} 2>/dev/null`
    )

    if (sizeResult.code !== 0) {
      return jsonError('Snapshot not found', 404)
    }

    return jsonSuccess({
      name: nameResult.data,
      path: snapshotPath,
      size: sizeResult.stdout.trim(),
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to get snapshot',
      500
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId, name } = await params

    const nameResult = snapshotNameSchema.safeParse(name)
    if (!nameResult.success) {
      return jsonError('Invalid snapshot name', 400)
    }

    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const command = getDeleteSnapshotCommand(machine.openclawPath, nameResult.data)
    const deleteResult = await exec(machine.id, sshConfig, command)

    if (deleteResult.code !== 0) {
      return jsonError('Delete failed', 500)
    }

    return jsonSuccess({ name: nameResult.data, deleted: true })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to delete snapshot',
      500
    )
  }
}
