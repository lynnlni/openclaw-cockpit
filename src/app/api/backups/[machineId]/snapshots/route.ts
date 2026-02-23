import { NextRequest } from 'next/server'
import { z } from 'zod'

import { exec } from '@/lib/ssh/client'
import { getExportCommand } from '@/lib/backup/exporter'
import { getListSnapshotsCommand, parseSnapshotList } from '@/lib/backup/snapshot'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

function sanitizeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 30)
}

function generateSnapshotName(machineName: string): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const safeName = sanitizeName(machineName)
  return `snapshot-${safeName}-${date}-${time}`
}

const createSnapshotSchema = z.object({
  name: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Snapshot name must be alphanumeric with hyphens or underscores').optional(),
  type: z.enum(['full', 'workspace']).default('full'),
})

interface RouteParams {
  params: Promise<{ machineId: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId } = await params
    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const listResult = await exec(
      machine.id,
      sshConfig,
      getListSnapshotsCommand(machine.openclawPath)
    )

    const snapshots = parseSnapshotList(listResult.stdout).map((s) => ({
      ...s,
      machineName: machine.name,
      machineHost: machine.host,
    }))

    return jsonSuccess(snapshots)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to list snapshots',
      500
    )
  }
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

    let body: unknown = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is fine — we'll use defaults
    }
    const parsed = createSnapshotSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const snapshotName = parsed.data.name ?? generateSnapshotName(machine.name)
    const snapshotType = parsed.data.type

    const command = getExportCommand(
      machine.openclawPath,
      snapshotName,
      snapshotType
    )

    const createResult = await exec(machine.id, sshConfig, command)

    if (createResult.code !== 0) {
      return jsonError('Snapshot creation failed', 500)
    }

    return jsonSuccess({
      created: true,
      name: snapshotName,
      type: snapshotType,
      machineName: machine.name,
      machineHost: machine.host,
    }, 201)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to create snapshot',
      500
    )
  }
}
