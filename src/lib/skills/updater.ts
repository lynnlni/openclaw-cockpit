import { join } from 'path'

export interface UpdateStatus {
  hasUpdate: boolean
  behind: number
}

export function getCheckUpdateCommand(
  skillName: string,
  skillsDir: string
): string {
  const target = join(skillsDir, skillName)
  return `cd "${target}" && git fetch --quiet && git rev-list HEAD..@{u} --count`
}

export function parseUpdateStatus(output: string): UpdateStatus {
  const trimmed = output.trim()
  const behind = parseInt(trimmed, 10)

  if (isNaN(behind)) {
    return { hasUpdate: false, behind: 0 }
  }

  return {
    hasUpdate: behind > 0,
    behind,
  }
}
