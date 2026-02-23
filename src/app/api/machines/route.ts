import { NextRequest } from 'next/server'

import { getMachines, addMachine } from '@/lib/machines/config'
import { createMachineSchema } from '@/lib/machines/schema'
import { jsonSuccess, jsonError } from '../_helpers'

export async function GET(): Promise<Response> {
  try {
    const machines = getMachines().map(({ encryptedPassword, ...rest }) => rest)
    return jsonSuccess(machines)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to list machines',
      500
    )
  }
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body: unknown = await request.json()
    const parsed = createMachineSchema.safeParse(body)

    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const machine = addMachine(parsed.data)
    const { encryptedPassword, ...safeData } = machine
    return jsonSuccess(safeData, 201)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to create machine',
      500
    )
  }
}
