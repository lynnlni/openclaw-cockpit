import { NextRequest } from 'next/server'
import { z } from 'zod'

import { exec } from '@/lib/ssh/client'
import { getImportCommand, getPreRestoreSnapshotCommand } from '@/lib/backup/importer'
import { getSnapshotDir } from '@/lib/backup/exporter'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

const importSchema = z.object({
  backupName: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Backup name must be alphanumeric with hyphens or underscores'),
  createSnapshot: z.boolean().default(true),
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
    const parsed = importSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    if (parsed.data.createSnapshot) {
      const snapshotCmd = getPreRestoreSnapshotCommand(machine.openclawPath)
      await exec(machine.id, sshConfig, snapshotCmd)
    }

    const backupsDir = getSnapshotDir(machine.openclawPath)
    const backupPath = `${backupsDir}/${parsed.data.backupName}.tar.gz`
    const importCmd = getImportCommand(machine.openclawPath, backupPath)
    const importResult = await exec(machine.id, sshConfig, importCmd)

    if (importResult.code !== 0) {
      return jsonError(`Import failed: ${importResult.stderr}`, 500)
    }

    return jsonSuccess({
      imported: true,
      backupName: parsed.data.backupName,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Import failed',
      500
    )
  }
}
