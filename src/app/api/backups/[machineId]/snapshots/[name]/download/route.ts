import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { shellEscapePath } from '@/lib/ssh/shell-escape'
import { getSnapshotDir } from '@/lib/backup/exporter'
import { snapshotNameSchema } from '@/lib/validation/schemas'
import { jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../../../_helpers'

const MAX_DOWNLOAD_SIZE = 500 * 1024 * 1024 // 500 MB

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
    const filePath = `${backupsDir}/${nameResult.data}.tar.gz`

    // Check file exists and size
    const sizeResult = await exec(
      machine.id,
      sshConfig,
      `stat -c %s ${shellEscapePath(filePath)} 2>/dev/null || stat -f %z ${shellEscapePath(filePath)} 2>/dev/null`
    )

    const fileSize = parseInt(sizeResult.stdout.trim(), 10)
    if (isNaN(fileSize) || sizeResult.code !== 0) {
      return jsonError('Snapshot not found', 404)
    }

    if (fileSize > MAX_DOWNLOAD_SIZE) {
      return jsonError(
        `Snapshot too large (${Math.round(fileSize / 1024 / 1024)} MB). Maximum download size is 500 MB.`,
        413
      )
    }

    // Read file as base64 via SSH
    const base64Result = await exec(
      machine.id,
      sshConfig,
      `base64 ${shellEscapePath(filePath)}`
    )

    if (base64Result.code !== 0) {
      return jsonError('Failed to read snapshot', 500)
    }

    const binaryData = Buffer.from(base64Result.stdout.replace(/\s/g, ''), 'base64')
    const fileName = `${nameResult.data}.tar.gz`

    return new Response(binaryData, {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': String(binaryData.length),
      },
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to download snapshot',
      500
    )
  }
}
