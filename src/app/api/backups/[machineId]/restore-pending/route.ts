import { NextRequest } from 'next/server'
import { z } from 'zod'

import { getMachine } from '@/lib/machines/config'
import {
  setPendingRestore,
  getPendingRestore,
  clearPendingRestore,
} from '@/lib/backup/push-store'
import { snapshotNameSchema, machineIdSchema } from '@/lib/validation/schemas'
import { jsonSuccess, jsonError, verifyPushToken } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string }>
}

const setPendingSchema = z.object({
  snapshotName: snapshotNameSchema,
})

// GET — OpenClaw polls for pending restore (Bearer pushToken required)
export async function GET(
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

    const pending = getPendingRestore(machineId)
    return jsonSuccess(pending)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to get pending restore',
      500
    )
  }
}

// POST — Dashboard user triggers a restore (no auth — internal Dashboard action)
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

    const machine = getMachine(machineId)
    if (!machine) {
      return jsonError('Machine not found', 404)
    }

    if (machine.connectionType !== 'push') {
      return jsonError('Machine is not a push-type machine', 400)
    }

    let body: unknown = {}
    try {
      body = await request.json()
    } catch {
      // Empty body
    }

    const parsed = setPendingSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    setPendingRestore(machineId, parsed.data.snapshotName)
    return jsonSuccess({ pending: true, snapshotName: parsed.data.snapshotName })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to set pending restore',
      500
    )
  }
}

// DELETE — OpenClaw clears pending restore after applying it (Bearer pushToken required)
export async function DELETE(
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

    clearPendingRestore(machineId)
    return jsonSuccess({ cleared: true })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to clear pending restore',
      500
    )
  }
}
