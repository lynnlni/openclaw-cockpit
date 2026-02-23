import { NextRequest } from 'next/server'

import { readFile, writeFile } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import { getMcpServersFromJson, addMcpServer } from '@/lib/mcp/config-manager'
import { mcpServerFormSchema } from '@/lib/mcp/schema'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

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
    const configJson = await readFile(machine.id, sshConfig, workspace.configPath)
    const servers = getMcpServersFromJson(configJson)

    return jsonSuccess(servers)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to list MCP servers',
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

    const body: unknown = await request.json()
    const parsed = mcpServerFormSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const workspace = getWorkspacePaths(machine.openclawPath)
    const configJson = await readFile(machine.id, sshConfig, workspace.configPath)
    const updatedJson = addMcpServer(configJson, parsed.data.name, parsed.data.server)
    await writeFile(machine.id, sshConfig, workspace.configPath, updatedJson)

    return jsonSuccess({ name: parsed.data.name, added: true }, 201)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to add MCP server',
      500
    )
  }
}
