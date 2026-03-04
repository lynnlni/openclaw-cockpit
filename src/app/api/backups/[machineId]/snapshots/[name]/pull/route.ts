import { NextRequest } from 'next/server'

import { getMachine } from '@/lib/machines/config'
import { readPushBackup } from '@/lib/backup/push-store'
import { snapshotNameSchema, machineIdSchema } from '@/lib/validation/schemas'
import { jsonError, verifyPushToken } from '../../../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string; name: string }>
}

// GET — serves the backup archive to the OpenClaw server for restore (Bearer pushToken required)
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId, name } = await params

    const idResult = machineIdSchema.safeParse(machineId)
    if (!idResult.success) {
      return jsonError('Invalid machine ID', 400)
    }

    const nameResult = snapshotNameSchema.safeParse(name)
    if (!nameResult.success) {
      return jsonError('Invalid snapshot name', 400)
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

    let buffer: Buffer
    try {
      buffer = readPushBackup(machineId, nameResult.data)
    } catch {
      return jsonError('Snapshot not found', 404)
    }

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${nameResult.data}.tar.gz"`,
        'Content-Length': String(buffer.length),
      },
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to serve backup',
      500
    )
  }
}
