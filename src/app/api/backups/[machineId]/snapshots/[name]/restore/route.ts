import { NextRequest } from 'next/server'
import { z } from 'zod'

import { exec } from '@/lib/ssh/client'
import { shellEscapePath } from '@/lib/ssh/shell-escape'
import { getSnapshotDir } from '@/lib/backup/exporter'
import { setPendingRestore } from '@/lib/backup/push-store'
import { snapshotNameSchema } from '@/lib/validation/schemas'
import { jsonSuccess, jsonError, resolveMachine, resolveMachineWithSSH, isErrorResponse } from '../../../../../_helpers'

const restoreBodySchema = z.object({
  type: z.enum(['full', 'workspace']).optional(),
}).optional()

interface RouteParams {
  params: Promise<{ machineId: string; name: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId, name } = await params

    const nameResult = snapshotNameSchema.safeParse(name)
    if (!nameResult.success) {
      return jsonError('Invalid snapshot name', 400)
    }

    const machine = resolveMachine(machineId)
    if (isErrorResponse(machine)) return machine

    // Push machines: set pending restore flag; OpenClaw script will poll and apply it
    if (machine.connectionType === 'push') {
      setPendingRestore(machineId, nameResult.data)
      return jsonSuccess({
        pendingRestore: true,
        name: nameResult.data,
        message: '恢复指令已下发，等待 OpenClaw 下次运行脚本时执行',
      })
    }

    // SSH machines: original behavior
    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { sshConfig } = result
    const backupsDir = getSnapshotDir(machine.openclawPath)
    const snapshotPath = `${backupsDir}/${nameResult.data}.tar.gz`

    // Parse optional body for restore type
    let restoreType: 'full' | 'workspace' | undefined
    try {
      const body = await request.json()
      const parsed = restoreBodySchema.safeParse(body)
      if (parsed.success && parsed.data?.type) {
        restoreType = parsed.data.type
      }
    } catch {
      // No body is fine — default to full
    }

    // Verify snapshot exists
    const checkResult = await exec(
      machine.id,
      sshConfig,
      `test -f ${shellEscapePath(snapshotPath)} && echo "exists"`
    )

    if (checkResult.stdout.trim() !== 'exists') {
      return jsonError('Snapshot not found', 404)
    }

    // Create a safety snapshot before restoring
    const safetyName = `pre-restore-${Date.now()}`
    const safetyPath = `${backupsDir}/${safetyName}.tar.gz`
    const safetyCmd = `mkdir -p ${shellEscapePath(backupsDir)} && tar -czf ${shellEscapePath(safetyPath)} --exclude=./backups -C ${shellEscapePath(machine.openclawPath)} .`

    await exec(machine.id, sshConfig, safetyCmd)

    // Determine target directory
    const targetDir = restoreType === 'workspace'
      ? `${machine.openclawPath}/workspace`
      : machine.openclawPath

    // Extract snapshot to target directory
    const restoreCmd = `tar -xzf ${shellEscapePath(snapshotPath)} -C ${shellEscapePath(targetDir)}`
    const restoreResult = await exec(machine.id, sshConfig, restoreCmd)

    if (restoreResult.code !== 0) {
      return jsonError('Restore failed', 500)
    }

    return jsonSuccess({
      restored: true,
      name: nameResult.data,
      safetySnapshot: safetyName,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to restore snapshot',
      500
    )
  }
}
