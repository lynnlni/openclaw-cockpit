import { NextRequest } from 'next/server'

import { updateMachine, deleteMachine } from '@/lib/machines/config'
import { updateMachineSchema } from '@/lib/machines/schema'
import { jsonSuccess, jsonError, resolveMachine, isErrorResponse } from '../../_helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params
    const result = resolveMachine(id)
    if (isErrorResponse(result)) return result

    const { encryptedPassword, ...safeData } = result
    return jsonSuccess(safeData)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to get machine',
      500
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params
    const result = resolveMachine(id)
    if (isErrorResponse(result)) return result

    const body: unknown = await request.json()
    const parsed = updateMachineSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const updated = updateMachine(id, parsed.data)
    const { encryptedPassword, ...safeData } = updated
    return jsonSuccess(safeData)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update machine',
      500
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params
    const result = resolveMachine(id)
    if (isErrorResponse(result)) return result

    deleteMachine(id)
    return jsonSuccess({ deleted: true })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to delete machine',
      500
    )
  }
}
