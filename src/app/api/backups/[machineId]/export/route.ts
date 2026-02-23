import { NextRequest } from 'next/server'
import { z } from 'zod'

import { exec } from '@/lib/ssh/client'
import { shellEscapePath } from '@/lib/ssh/shell-escape'
import { getExportCommand, getSnapshotDir } from '@/lib/backup/exporter'
import { jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

const MAX_DOWNLOAD_SIZE = 500 * 1024 * 1024 // 500 MB

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 30)
}

function generateExportName(machineName: string): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const safeName = sanitizeName(machineName)
  return `openclaw-export-${safeName}-${date}-${time}`
}

const exportSchema = z.object({
  name: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  type: z.enum(['full', 'workspace']).default('full'),
})

interface RouteParams {
  params: Promise<{ machineId: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  return handleExport({}, params)
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  let body: unknown = {}
  try {
    body = await request.json()
  } catch {
    // Empty body is fine
  }
  return handleExport(body, params)
}

async function handleExport(
  body: unknown,
  params: Promise<{ machineId: string }>
): Promise<Response> {
  try {
    const { machineId } = await params
    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result

    const parsed = exportSchema.safeParse(body)
    const exportName = parsed.success ? (parsed.data.name ?? generateExportName(machine.name)) : generateExportName(machine.name)
    const exportType = parsed.success ? parsed.data.type : 'full'

    const backupsDir = getSnapshotDir(machine.openclawPath)
    const fileName = `${exportName}.tar.gz`
    const filePath = `${backupsDir}/${fileName}`

    // Create the tar.gz on the remote server
    const command = getExportCommand(machine.openclawPath, exportName, exportType)
    const createResult = await exec(machine.id, sshConfig, command)

    if (createResult.code !== 0) {
      return jsonError('Export failed', 500)
    }

    // Check file size before downloading
    const sizeResult = await exec(
      machine.id,
      sshConfig,
      `stat -c %s ${shellEscapePath(filePath)} 2>/dev/null || stat -f %z ${shellEscapePath(filePath)} 2>/dev/null`
    )

    const fileSize = parseInt(sizeResult.stdout.trim(), 10)
    if (isNaN(fileSize) || fileSize > MAX_DOWNLOAD_SIZE) {
      return jsonError(
        `Export file too large (${Math.round(fileSize / 1024 / 1024)} MB). Maximum download size is 500 MB.`,
        413
      )
    }

    // Read file as base64 via SSH and stream to browser
    const base64Result = await exec(
      machine.id,
      sshConfig,
      `base64 ${shellEscapePath(filePath)}`
    )

    if (base64Result.code !== 0) {
      return jsonError('Failed to read exported file', 500)
    }

    const binaryData = Buffer.from(base64Result.stdout.replace(/\s/g, ''), 'base64')

    // Clean up the temp export file on the server
    await exec(machine.id, sshConfig, `rm -f ${shellEscapePath(filePath)}`)

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
      error instanceof Error ? error.message : 'Export failed',
      500
    )
  }
}
