import { NextRequest } from 'next/server'
import { z } from 'zod'

import { exec } from '@/lib/ssh/client'
import { readFile, writeFile } from '@/lib/ssh/client'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import { parseSkillFileLenient, serializeSkillFile } from '@/lib/workspace/skill-parser'
import { getUninstallCommand } from '@/lib/skills/installer'
import { skillNameSchema } from '@/lib/validation/schemas'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../../_helpers'

const updateSkillSchema = z.object({
  frontmatter: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    version: z.string().optional(),
    author: z.string().optional(),
    enabled: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  content: z.string().optional(),
})

interface RouteParams {
  params: Promise<{ machineId: string; name: string }>
}

export async function GET(
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
    const skillPath = `${workspace.skillsDir}/${nameResult.data}/SKILL.md`

    const content = await readFile(machine.id, sshConfig, skillPath)
    const skill = parseSkillFileLenient(content)

    return jsonSuccess({
      ...skill.frontmatter,
      name: skill.frontmatter.name || nameResult.data,
      description: skill.frontmatter.description || '',
      content: skill.content,
    })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to get skill',
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
    const nameResult = skillNameSchema.safeParse(name)
    if (!nameResult.success) {
      return jsonError('Invalid skill name', 400)
    }

    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const workspace = getWorkspacePaths(machine.openclawPath)
    const skillPath = `${workspace.skillsDir}/${nameResult.data}/SKILL.md`

    const body: unknown = await request.json()
    const parsed = updateSkillSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request body', 400)
    }

    const existing = await readFile(machine.id, sshConfig, skillPath)
    const skill = parseSkillFileLenient(existing)

    const updatedSkill = {
      ...skill,
      frontmatter: {
        ...skill.frontmatter,
        ...(parsed.data.frontmatter ?? {}),
      },
      content: parsed.data.content ?? skill.content,
    }

    await writeFile(machine.id, sshConfig, skillPath, serializeSkillFile(updatedSkill))

    return jsonSuccess({ name: nameResult.data, updated: true })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to update skill',
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
    const nameResult = skillNameSchema.safeParse(name)
    if (!nameResult.success) {
      return jsonError('Invalid skill name', 400)
    }

    const result = resolveMachineWithSSH(machineId)
    if (isErrorResponse(result)) return result

    const { machine, sshConfig } = result
    const workspace = getWorkspacePaths(machine.openclawPath)

    const uninstallResult = await exec(
      machine.id,
      sshConfig,
      getUninstallCommand(nameResult.data, workspace.skillsDir)
    )

    if (uninstallResult.code !== 0) {
      return jsonError(`Uninstall failed: ${uninstallResult.stderr}`, 500)
    }

    return jsonSuccess({ name: nameResult.data, deleted: true })
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to delete skill',
      500
    )
  }
}
