import { NextResponse } from 'next/server'

import { getMachine, getDecryptedConfig, validatePushToken } from '@/lib/machines/config'
import type { Machine } from '@/lib/machines/types'
import type { SSHConnectionConfig } from '@/lib/ssh/types'
import { machineIdSchema } from '@/lib/validation/schemas'

export interface MachineWithSSH {
  machine: Machine
  sshConfig: SSHConnectionConfig
}

export function jsonSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status })
}

export function jsonError(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error }, { status })
}

export function resolveMachine(machineId: string): Machine | NextResponse {
  const idResult = machineIdSchema.safeParse(machineId)
  if (!idResult.success) {
    return jsonError('Invalid machine ID', 400)
  }

  const machine = getMachine(idResult.data)
  if (!machine) {
    return jsonError('Machine not found', 404)
  }

  return machine
}

export function resolveMachineWithSSH(
  machineId: string
): MachineWithSSH | NextResponse {
  const result = resolveMachine(machineId)
  if (result instanceof NextResponse) {
    return result
  }

  if (result.connectionType === 'push') {
    return jsonError('This operation is not supported for push-type machines', 400)
  }

  const sshConfig = getDecryptedConfig(result)
  return { machine: result, sshConfig }
}

export function isErrorResponse(
  value: unknown
): value is NextResponse {
  return value instanceof NextResponse
}

export function containsTraversal(segments: string[]): boolean {
  return segments.some((s) => s === '..' || s.includes('..'))
}

export function verifyPushToken(
  machineId: string,
  authHeader: string | null
): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  const token = authHeader.slice(7)
  return validatePushToken(machineId, token)
}
