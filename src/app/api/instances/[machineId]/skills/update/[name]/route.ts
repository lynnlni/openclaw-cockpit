import { NextRequest } from 'next/server'

import { exec } from '@/lib/ssh/client'
import { readFile, writeFile } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import { getInstallFromRawCommand } from '@/lib/skills/installer'
import { parseRegistry, serializeRegistry, updateInRegistry } from '@/lib/skills/registry'
import { skillNameSchema } from '@/lib/validation/schemas'
import type { DiscoveredSkill } from '@/lib/skills/types'
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
    const nameResult = skillNameSchema.safeParse(name)
    if (!nameResult.success) {
      return jsonError('Invalid skill name', 400)
    }

    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const workspace = getWorkspacePaths(machine.openclawPath)

    const registryPath = `${workspace.skillsDir}/registry.json`
    let source = ''
    try {
      const regContent = await readFile(machine.id, sshConfig, registryPath)
      const registry = parseRegistry(regContent)
      const skill = registry.find((s) => s.name === nameResult.data)
      if (skill) {
        source = skill.source
      }
    } catch {
      // Continue without registry info
    }

    const [repoOwner, repoName] = source.includes('/')
      ? source.split('/')
      : ['unknown', 'unknown']

    const discovered: DiscoveredSkill = {
      name: nameResult.data,
      description: '',
      repoOwner,
      repoName,
      repoBranch: 'main',
      path: nameResult.data,
      installed: true,
    }

    const updateResult = await exec(
      machine.id,
      sshConfig,
      getInstallFromRawCommand(discovered, workspace.skillsDir)
    )

    if (updateResult.code !== 0) {
      return jsonError(`Update failed: ${updateResult.stderr}`, 500)
    }

    try {
      const regContent = await readFile(machine.id, sshConfig, registryPath)
      const registry = parseRegistry(regContent)
      const updated = updateInRegistry(registry, nameResult.data, {
        updatedAt: new Date().toISOString(),
        hasUpdate: false,
      })
      await writeFile(machine.id, sshConfig, registryPath, serializeRegistry(updated))
    } catch {
      // Registry update is best-effort
    }

    return jsonSuccess({
      name: nameResult.data,
      updated: true,
      output: updateResult.stdout,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update skill',
      500
    )
  }
}
