export interface SkillRepo {
  owner: string
  name: string
  branch: string
  enabled: boolean
  skillsPath: string | null
  isDefault: boolean
}

export interface DiscoveredSkill {
  name: string
  description: string
  version?: string
  author?: string
  repoOwner: string
  repoName: string
  repoBranch: string
  path: string
  installed: boolean
  alwaysApply?: boolean
  license?: string
}

export interface InstalledSkill {
  name: string
  version?: string
  description?: string
  author?: string
  tags?: string[]
  enabled?: boolean
  alwaysApply?: boolean
  source: string
  installedAt: string
  updatedAt: string
  hasUpdate?: boolean
  /** Total invocation count parsed from OpenClaw logs */
  invocationCount?: number
  /** Content preview (first N chars of SKILL.md body) */
  contentPreview?: string
}
