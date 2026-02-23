import type { DiscoveredSkill } from './types'
import { shellEscape, shellEscapePath } from '@/lib/ssh/shell-escape'

export function getInstallCommand(
  skill: DiscoveredSkill,
  targetDir: string
): string {
  const repoUrl = `https://github.com/${skill.repoOwner}/${skill.repoName}.git`
  const dest = `${targetDir}/${skill.name}`
  const skillPathInRepo = skill.path

  return [
    `rm -rf ${shellEscapePath(dest)}`,
    `git clone --depth 1 --branch ${shellEscape(skill.repoBranch)} --single-branch --filter=blob:none --sparse ${shellEscape(repoUrl)} ${shellEscapePath(dest + '.tmp')}`,
    `cd ${shellEscapePath(dest + '.tmp')}`,
    `git sparse-checkout set ${shellEscape(skillPathInRepo)}`,
    `mkdir -p ${shellEscapePath(dest)}`,
    `cp -r ${shellEscapePath(dest + '.tmp/' + skillPathInRepo + '/.')} ${shellEscapePath(dest + '/')}`,
    `rm -rf ${shellEscapePath(dest + '.tmp')}`,
  ].join(' && ')
}

export function getInstallFromRawCommand(
  skill: DiscoveredSkill,
  targetDir: string
): string {
  const dest = `${targetDir}/${skill.name}`
  const rawBase = `https://raw.githubusercontent.com/${skill.repoOwner}/${skill.repoName}/${skill.repoBranch}/${skill.path}`

  return [
    `mkdir -p ${shellEscapePath(dest)}`,
    `curl -fsSL ${shellEscape(rawBase + '/SKILL.md')} -o ${shellEscapePath(dest + '/SKILL.md')}`,
  ].join(' && ')
}

export function getUninstallCommand(
  skillName: string,
  skillsDir: string
): string {
  const target = `${skillsDir}/${skillName}`
  return `rm -rf ${shellEscapePath(target)}`
}

export function getUpdateCommand(
  skill: DiscoveredSkill,
  targetDir: string
): string {
  return getInstallCommand(skill, targetDir)
}
