import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { readFile } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import { getMcpServersFromJson } from '@/lib/mcp/config-manager'
import { getTestCommand, parseTestResult } from '@/lib/mcp/tester'
import { mcpServerNameSchema } from '@/lib/validation/schemas'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string; name: string }>
}

export async function POST(
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

    const testCommand = getTestCommand(server)
    const testResult = await exec(machine.id, sshConfig, testCommand)
    const parsed = parseTestResult(testResult.stdout, testResult.code)

    return jsonSuccess(parsed)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to test MCP server',
      500
    )
  }
}
