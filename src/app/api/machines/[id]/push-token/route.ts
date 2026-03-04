import { NextRequest } from 'next/server'

import { getMachine, generateMachinePushToken, revokeMachinePushToken } from '@/lib/machines/config'
import { machineIdSchema } from '@/lib/validation/schemas'
import { jsonSuccess, jsonError } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST — generate or rotate push token
export async function POST(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params

    const idResult = machineIdSchema.safeParse(id)
    if (!idResult.success) {
      return jsonError('Invalid machine ID', 400)
    }

    const machine = getMachine(idResult.data)
    if (!machine) {
      return jsonError('Machine not found', 404)
    }

    if (machine.connectionType !== 'push') {
      return jsonError('Push tokens are only available for push-type machines', 400)
    }

    const token = generateMachinePushToken(idResult.data)
    return jsonSuccess({ token }, 201)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to generate push token',
      500
    )
  }
}

// DELETE — revoke push token
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params

    const idResult = machineIdSchema.safeParse(id)
    if (!idResult.success) {
      return jsonError('Invalid machine ID', 400)
    }

    const machine = getMachine(idResult.data)
    if (!machine) {
      return jsonError('Machine not found', 404)
    }

    revokeMachinePushToken(idResult.data)
    return jsonSuccess({ revoked: true })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to revoke push token',
      500
    )
  }
}
