import { NextRequest } from 'next/server'
import { z } from 'zod'

import { exec } from '@/lib/ssh/client'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

const bodySchema = z.object({
  command: z.string().min(1).max(2048),
})

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { id } = await params

    const result = resolveMachineWithSSH(id)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return jsonError('Request body is required', 400)
    }

    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return jsonError('command is required and must be a non-empty string (max 2048 chars)', 400)
    }

    const execResult = await exec(machine.id, sshConfig, parsed.data.command)

    return jsonSuccess({
      stdout: execResult.stdout,
      stderr: execResult.stderr,
      code: execResult.code ?? 0,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to execute command',
      500
    )
  }
}
