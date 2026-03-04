import { NextRequest } from 'next/server'

import { getMachine, updatePushMetadata } from '@/lib/machines/config'
import { savePushBackup, pruneOldBackups } from '@/lib/backup/push-store'
import { snapshotNameSchema } from '@/lib/validation/schemas'
import { jsonSuccess, jsonError, verifyPushToken } from '../../../_helpers'
import { machineIdSchema } from '@/lib/validation/schemas'

const MAX_PUSH_SIZE = 500 * 1024 * 1024 // 500 MB

interface RouteParams {
  params: Promise<{ machineId: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId } = await params

    const idResult = machineIdSchema.safeParse(machineId)
    if (!idResult.success) {
      return jsonError('Invalid machine ID', 400)
    }

    if (!verifyPushToken(machineId, request.headers.get('Authorization'))) {
      return jsonError('Unauthorized', 401)
    }

    const machine = getMachine(machineId)
    if (!machine) {
      return jsonError('Machine not found', 404)
    }

    if (machine.connectionType !== 'push') {
      return jsonError('Machine is not a push-type machine', 400)
    }

    const backupName = request.headers.get('X-Backup-Name') ?? ''
    const openclawVersion = request.headers.get('X-OpenClaw-Version') ?? undefined

    const nameResult = snapshotNameSchema.safeParse(backupName)
    if (!nameResult.success) {
      return jsonError('Invalid or missing X-Backup-Name header', 400)
    }

    const arrayBuffer = await request.arrayBuffer()
    if (arrayBuffer.byteLength === 0) {
      return jsonError('Empty backup body', 400)
    }
    if (arrayBuffer.byteLength > MAX_PUSH_SIZE) {
      return jsonError('Backup file too large (max 500 MB)', 413)
    }

    const buffer = Buffer.from(arrayBuffer)
    savePushBackup(machineId, nameResult.data, buffer)

    const retainDays = machine.pushRetainDays ?? 7
    pruneOldBackups(machineId, retainDays)

    const pushAt = new Date().toISOString()
    updatePushMetadata(machineId, openclawVersion, pushAt)

    return jsonSuccess({ received: true, name: nameResult.data }, 201)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to receive backup',
      500
    )
  }
}
