import { NextRequest } from 'next/server'

import { readFile, writeFile } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import {
  getMcpServersFromJson,
  updateMcpServer,
  removeMcpServer,
} from '@/lib/mcp/config-manager'
import { mcpServerSchema } from '@/lib/mcp/schema'
import { mcpServerNameSchema } from '@/lib/validation/schemas'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string; name: string }>
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId, name } = await params
    const nameResult = mcpServerNameSchema.safeParse(name)
    if (!nameResult.success) {
      return jsonError('Invalid server name', 400)
    }

    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const workspace = getWorkspacePaths(machine.openclawPath)
    const configJson = await readFile(machine.id, sshConfig, workspace.configPath)
    const servers = getMcpServersFromJson(configJson)

    const server = servers[nameResult.data]
    if (!server) {
      return jsonError('MCP server not found', 404)
    }

    return jsonSuccess({ name: nameResult.data, ...server })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to get MCP server',
      500
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId, name } = await params
    const nameResult = mcpServerNameSchema.safeParse(name)
    if (!nameResult.success) {
      return jsonError('Invalid server name', 400)
    }

    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result

    const body: unknown = await request.json()
    const parsed = mcpServerSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const workspace = getWorkspacePaths(machine.openclawPath)
    const configJson = await readFile(machine.id, sshConfig, workspace.configPath)
    const updatedJson = updateMcpServer(configJson, nameResult.data, parsed.data)
    await writeFile(machine.id, sshConfig, workspace.configPath, updatedJson)

    return jsonSuccess({ name: nameResult.data, updated: true })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update MCP server',
      500
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId, name } = await params
    const nameResult = mcpServerNameSchema.safeParse(name)
    if (!nameResult.success) {
      return jsonError('Invalid server name', 400)
    }

    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const workspace = getWorkspacePaths(machine.openclawPath)
    const configJson = await readFile(machine.id, sshConfig, workspace.configPath)
    const updatedJson = removeMcpServer(configJson, nameResult.data)
    await writeFile(machine.id, sshConfig, workspace.configPath, updatedJson)

    return jsonSuccess({ name: nameResult.data, deleted: true })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to delete MCP server',
      500
    )
  }
}
