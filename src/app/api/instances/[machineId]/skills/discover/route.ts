import { NextRequest } from 'next/server'

import { readFile } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import { parseRegistry } from '@/lib/skills/registry'
import { getDefaultRepos } from '@/lib/skills/repo-manager'
import { discoverAllSkills } from '@/lib/skills/discovery'
import type { SkillRepo, InstalledSkill } from '@/lib/skills/types'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../../_helpers'

interface RouteParams {
  params: Promise<{ machineId: string }>
}

async function loadRepos(
  machineId: string,
  sshConfig: Parameters<typeof readFile>[1],
  reposPath: string
): Promise<SkillRepo[]> {
  try {
    const content = await readFile(machineId, sshConfig, reposPath)
    return JSON.parse(content) as SkillRepo[]
  } catch {
    return getDefaultRepos()
  }
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
    const registryPath = `${workspace.skillsDir}/registry.json`
    const reposPath = `${workspace.skillsDir}/repos.json`

    let installedSkills: InstalledSkill[] = []
    try {
      const regContent = await readFile(machine.id, sshConfig, registryPath)
      installedSkills = parseRegistry(regContent)
    } catch {
      installedSkills = []
    }

    const installedNames = new Set(installedSkills.map((s) => s.name))

    const repos = await loadRepos(machine.id, sshConfig, reposPath)

    const allDiscovered = await discoverAllSkills(repos)

    const withStatus = allDiscovered.map((skill) => ({
      ...skill,
      installed: installedNames.has(skill.name),
    }))

    return jsonSuccess(withStatus)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to discover skills',
      500
    )
  }
}
