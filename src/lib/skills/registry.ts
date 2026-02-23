import type { InstalledSkill } from './types'

export function parseRegistry(content: string): InstalledSkill[] {
  try {
    const parsed = JSON.parse(content)
    if (!Array.isArray(parsed)) {
      throw new Error('Registry must be a JSON array')
    }
    return parsed as InstalledSkill[]
  } catch (error) {
    throw new Error(
      `Failed to parse skills registry: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export function serializeRegistry(skills: InstalledSkill[]): string {
  return JSON.stringify(skills, null, 2)
}

export function addToRegistry(
  registry: InstalledSkill[],
  skill: InstalledSkill
): InstalledSkill[] {
  return [...registry, skill]
}

export function removeFromRegistry(
  registry: InstalledSkill[],
  name: string
): InstalledSkill[] {
  return registry.filter((s) => s.name !== name)
}

export function updateInRegistry(
  registry: InstalledSkill[],
  name: string,
  updates: Partial<InstalledSkill>
): InstalledSkill[] {
  return registry.map((skill) =>
    skill.name === name ? { ...skill, ...updates } : skill
  )
}
