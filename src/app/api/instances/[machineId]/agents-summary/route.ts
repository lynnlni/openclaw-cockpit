import { NextRequest } from 'next/server'
import { z } from 'zod'

import { exec, shellPath } from '@/lib/ssh/client'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

const SAFE_ID = /^[a-zA-Z0-9_-]+$/

const bodySchema = z.object({
  agents: z
    .array(
      z.object({
        id: z.string(),
        workspace: z.string().optional(),
      }),
    )
    .max(100),
})

export interface AgentSummary {
  identityLine: string
  soulLine: string
  status: 'running' | 'stopped' | 'unknown'
}

interface RouteParams {
  params: Promise<{ machineId: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams,
): Promise<Response> {
  try {
    const { machineId } = await params

    const result = resolveMachineWithSSH(machineId)
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
      return jsonError('Invalid request body', 400)
    }

    const agents = parsed.data.agents.filter((a) => SAFE_ID.test(a.id))
    if (agents.length === 0) {
      return jsonSuccess({} as Record<string, AgentSummary>)
    }

    // Build one shell script that reads all agent data in a single SSH round-trip
    const lines: string[] = []
    for (const agent of agents) {
      const safeId = agent.id
      lines.push(`echo "AGENT_START:${safeId}"`)

      if (agent.workspace) {
        const quotedWs = shellPath(agent.workspace)
        lines.push(
          `identity=$(head -30 ${quotedWs}/IDENTITY.md 2>/dev/null | grep -m1 '^[^#[:space:]]' | sed 's/^[[:space:]]*//')`,
        )
        lines.push(`echo "IDENTITY:$identity"`)
        lines.push(
          `soul=$(head -30 ${quotedWs}/SOUL.md 2>/dev/null | grep -m1 '^[^#[:space:]]' | sed 's/^[[:space:]]*//')`,
        )
        lines.push(`echo "SOUL:$soul"`)
      } else {
        lines.push(`echo "IDENTITY:"`)
        lines.push(`echo "SOUL:"`)
      }

      lines.push(
        `pgrep -f 'openclaw.*${safeId}' > /dev/null 2>&1 && echo "STATUS:running" || echo "STATUS:stopped"`,
      )
      lines.push(`echo "AGENT_END"`)
    }

    const execResult = await exec(machine.id, sshConfig, lines.join('\n'))

    // Parse the delimited output
    const summaries: Record<string, AgentSummary> = {}
    let currentId: string | null = null
    let current: Partial<AgentSummary> = {}

    for (const line of execResult.stdout.split('\n')) {
      if (line.startsWith('AGENT_START:')) {
        currentId = line.slice('AGENT_START:'.length).trim()
        current = { status: 'unknown' }
      } else if (line.startsWith('IDENTITY:') && currentId) {
        current.identityLine = line.slice('IDENTITY:'.length).trim()
      } else if (line.startsWith('SOUL:') && currentId) {
        current.soulLine = line.slice('SOUL:'.length).trim()
      } else if (line.startsWith('STATUS:') && currentId) {
        const s = line.slice('STATUS:'.length).trim()
        current.status = s === 'running' ? 'running' : 'stopped'
      } else if (line.startsWith('AGENT_END') && currentId) {
        summaries[currentId] = {
          identityLine: current.identityLine ?? '',
          soulLine: current.soulLine ?? '',
          status: current.status ?? 'unknown',
        }
        currentId = null
        current = {}
      }
    }

    return jsonSuccess(summaries)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to fetch agents summary',
      500,
    )
  }
}
