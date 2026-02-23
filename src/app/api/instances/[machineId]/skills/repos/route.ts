import { NextRequest } from 'next/server'
import { z } from 'zod'

import { readFile, writeFile } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import { getDefaultRepos, addRepo, removeRepo } from '@/lib/skills/repo-manager'
import type { SkillRepo } from '@/lib/skills/types'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../../_helpers'

const addRepoSchema = z.object({
  owner: z.string().min(1),
  name: z.string().min(1),
  branch: z.string().default('main'),
  skillsPath: z.string().nullable().default(null),
})

const deleteRepoSchema = z.object({
  owner: z.string().min(1),
  name: z.string().min(1),
})

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
    const reposPath = `${workspace.skillsDir}/repos.json`

    const repos = await loadRepos(machine.id, sshConfig, reposPath)

    return jsonSuccess(repos)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to list repos',
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
    const parsed = addRepoSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const workspace = getWorkspacePaths(machine.openclawPath)
    const reposPath = `${workspace.skillsDir}/repos.json`

    const repos = await loadRepos(machine.id, sshConfig, reposPath)

    const newRepo: SkillRepo = {
      owner: parsed.data.owner,
      name: parsed.data.name,
      branch: parsed.data.branch,
      enabled: true,
      skillsPath: parsed.data.skillsPath,
      isDefault: false,
    }

    const updated = addRepo(repos, newRepo)
    await writeFile(machine.id, sshConfig, reposPath, JSON.stringify(updated, null, 2))

    return jsonSuccess(newRepo, 201)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to add repo',
      500
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<Response> {
  try {
    const { machineId } = await params
    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result

    const body: unknown = await request.json()
    const parsed = deleteRepoSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const workspace = getWorkspacePaths(machine.openclawPath)
    const reposPath = `${workspace.skillsDir}/repos.json`

    const repos = await loadRepos(machine.id, sshConfig, reposPath)
    const updated = removeRepo(repos, parsed.data.owner, parsed.data.name)
    await writeFile(machine.id, sshConfig, reposPath, JSON.stringify(updated, null, 2))

    return jsonSuccess({ deleted: true })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to remove repo',
      500
    )
  }
}
