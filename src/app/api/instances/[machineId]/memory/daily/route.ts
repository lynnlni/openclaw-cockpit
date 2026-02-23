import { NextRequest } from 'next/server'

import { listDir } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import { parseDailyMemoryFilename } from '@/lib/workspace/memory-parser'
import type { DailyMemory } from '@/lib/workspace/types'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../../_helpers'

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
    const workspace = getWorkspacePaths(machine.openclawPath)

    let entries
    try {
      entries = await listDir(machine.id, sshConfig, workspace.memoryDir)
    } catch {
      return jsonSuccess([])
    }

    const memories: DailyMemory[] = entries
      .filter((entry) => entry.type === 'file' && entry.name.endsWith('.md'))
      .reduce<DailyMemory[]>((acc, entry) => {
        const date = parseDailyMemoryFilename(entry.name)
        if (date) {
          acc.push({
            date,
            filename: entry.name,
            path: `workspace/memory/${entry.name}`,
          })
        }
        return acc
      }, [])

    return jsonSuccess(memories)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to list daily memories',
      500
    )
  }
}
