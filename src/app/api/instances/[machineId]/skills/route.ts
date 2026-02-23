import { NextRequest } from 'next/server'
import { z } from 'zod'

import { exec, readFile, listDir } from '@/lib/ssh/client'
import { shellEscape, shellEscapePath } from '@/lib/ssh/shell-escape'
import { getWorkspacePaths } from '@/lib/workspace/parser'
import { parseSkillFileLenient } from '@/lib/workspace/skill-parser'
import { getInstallFromRawCommand } from '@/lib/skills/installer'
import type { InstalledSkill, DiscoveredSkill } from '@/lib/skills/types'
import { jsonSuccess, jsonError, resolveMachineWithSSH, isErrorResponse } from '../../../_helpers'

/** Only allow safe characters in fields that end up in shell commands */
const safeNamePattern = /^[a-zA-Z0-9_.-]+$/
const safePathPattern = /^[a-zA-Z0-9_./-]+$/

const installSkillSchema = z.object({
  name: z.string().min(1).regex(safeNamePattern, 'Name contains invalid characters'),
  description: z.string().default(''),
  repoOwner: z.string().min(1).regex(safeNamePattern, 'Repo owner contains invalid characters'),
  repoName: z.string().min(1).regex(safeNamePattern, 'Repo name contains invalid characters'),
  repoBranch: z.string().regex(safePathPattern, 'Branch contains invalid characters').default('main'),
  path: z.string().min(1).regex(safePathPattern, 'Path contains invalid characters'),
  alwaysApply: z.boolean().optional(),
})

interface RouteParams {
  params: Promise<{ machineId: string }>
}

const CONTENT_PREVIEW_LENGTH = 200

/**
 * Scan the skills directory for actual SKILL.md files
 * instead of relying on a registry.json that may not exist.
 */
async function scanInstalledSkills(
  machineId: string,
  sshConfig: Parameters<typeof exec>[1],
  skillsDir: string
): Promise<InstalledSkill[]> {
  let entries
  try {
    entries = await listDir(machineId, sshConfig, skillsDir)
  } catch {
    return []
  }

  const dirs = entries.filter((e) => e.type === 'directory')

  // Limit concurrency to avoid overwhelming the SSH connection
  const BATCH_SIZE = 5
  const skills: InstalledSkill[] = []

  for (let i = 0; i < dirs.length; i += BATCH_SIZE) {
    const batch = dirs.slice(i, i + BATCH_SIZE)
    const readPromises = batch.map(async (dir) => {
      const skillMdPath = `${skillsDir}/${dir.name}/SKILL.md`
      try {
        const content = await readFile(machineId, sshConfig, skillMdPath)
        const parsed = parseSkillFileLenient(content)
        const fm = parsed.frontmatter

        return {
          name: fm.name ?? dir.name,
          version: fm.version,
          description: fm.description,
          author: fm.author,
          tags: fm.tags,
          enabled: fm.enabled !== false,
          alwaysApply: fm.alwaysApply === true,
          source: 'local',
          installedAt: dir.modifiedAt ?? '',
          updatedAt: dir.modifiedAt ?? '',
          contentPreview: parsed.content.trim().slice(0, CONTENT_PREVIEW_LENGTH),
        } satisfies InstalledSkill
      } catch {
        return {
          name: dir.name,
          description: undefined,
          source: 'local',
          installedAt: dir.modifiedAt ?? '',
          updatedAt: dir.modifiedAt ?? '',
          enabled: true,
        } satisfies InstalledSkill
      }
    })

    const results = await Promise.allSettled(readPromises)
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        skills.push(result.value)
      }
    }
  }

  return skills
}

/**
 * Try to get skill invocation counts from OpenClaw logs.
 * Uses shell-escaped skill names for safety.
 * Returns approximate mention counts (best-effort).
 */
async function getSkillInvocationCounts(
  machineId: string,
  sshConfig: Parameters<typeof exec>[1],
  openclawPath: string,
  skillNames: string[]
): Promise<Record<string, number>> {
  if (skillNames.length === 0) return {}

  // Only process names that are safe for shell use
  const safeNames = skillNames.filter((n) => safeNamePattern.test(n))
  if (safeNames.length === 0) return {}

  const counts: Record<string, number> = {}

  const logPaths = [
    `${openclawPath}/logs`,
    `${openclawPath}/workspace/logs`,
  ]

  for (const logPath of logPaths) {
    try {
      // Single batched grep command for all skill names
      const pattern = safeNames.join('\\|')
      const result = await exec(
        machineId,
        sshConfig,
        `grep -rci ${shellEscape(pattern)} ${shellEscapePath(logPath)} 2>/dev/null || true`
      )
      if (result.code === 0 && result.stdout.trim()) {
        // Output format: filename:count per line
        const lines = result.stdout.trim().split('\n')
        const totalMatches = lines.reduce((sum, line) => {
          const match = line.match(/:(\d+)$/)
          return sum + (match ? parseInt(match[1]!, 10) : 0)
        }, 0)

        if (totalMatches > 0) {
          // Get per-skill counts with safe escaping
          for (const name of safeNames) {
            const perSkill = await exec(
              machineId,
              sshConfig,
              `grep -rci ${shellEscape(name)} ${shellEscapePath(logPath)} 2>/dev/null || true`
            )
            const lines = perSkill.stdout.trim().split('\n')
            const count = lines.reduce((sum, line) => {
              const match = line.match(/:(\d+)$/)
              return sum + (match ? parseInt(match[1]!, 10) : 0)
            }, 0)
            if (count > 0) {
              counts[name] = (counts[name] ?? 0) + count
            }
          }
        }
      }
    } catch {
      // best-effort
    }
  }

  return counts
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

    const skills = await scanInstalledSkills(
      machine.id,
      sshConfig,
      workspace.skillsDir
    )

    // Enrich with invocation counts (best-effort, won't block on failure)
    const skillNames = skills.map((s) => s.name)
    const invocations = await getSkillInvocationCounts(
      machine.id,
      sshConfig,
      machine.openclawPath,
      skillNames
    )

    const enrichedSkills = skills.map((skill) => ({
      ...skill,
      invocationCount: invocations[skill.name] ?? 0,
    }))

    return jsonSuccess(enrichedSkills)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to list skills',
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
    const parsed = installSkillSchema.safeParse(body)
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400)
    }

    const workspace = getWorkspacePaths(machine.openclawPath)
    const discovered: DiscoveredSkill = {
      name: parsed.data.name,
      description: parsed.data.description,
      repoOwner: parsed.data.repoOwner,
      repoName: parsed.data.repoName,
      repoBranch: parsed.data.repoBranch,
      path: parsed.data.path,
      installed: false,
      alwaysApply: parsed.data.alwaysApply,
    }

    const installResult = await exec(
      machine.id,
      sshConfig,
      getInstallFromRawCommand(discovered, workspace.skillsDir)
    )

    if (installResult.code !== 0) {
      return jsonError(`Install failed: ${installResult.stderr}`, 500)
    }

    const now = new Date().toISOString()
    const newSkill: InstalledSkill = {
      name: parsed.data.name,
      description: parsed.data.description,
      source: `${parsed.data.repoOwner}/${parsed.data.repoName}`,
      installedAt: now,
      updatedAt: now,
      alwaysApply: parsed.data.alwaysApply,
    }

    return jsonSuccess(newSkill, 201)
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Failed to install skill',
      500
    )
  }
}
