import matter from 'gray-matter'
import { z } from 'zod'
import type { SkillFile, SkillFrontmatter } from './types'

const skillFrontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().optional(),
  author: z.string().optional(),
  enabled: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
}).passthrough()

/** Lenient schema for scanning — won't throw on missing fields */
const skillFrontmatterLenientSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  version: z.string().optional(),
  author: z.string().optional(),
  enabled: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  alwaysApply: z.boolean().optional(),
}).passthrough()

export function parseSkillFile(rawContent: string): SkillFile {
  const parsed = matter(rawContent)
  const frontmatter = validateFrontmatter(parsed.data)

  return {
    frontmatter,
    content: parsed.content,
    rawContent,
  }
}

/**
 * Parse a SKILL.md file leniently — won't throw on missing fields.
 * Useful for scanning directories where SKILL.md may be incomplete.
 */
export function parseSkillFileLenient(rawContent: string): SkillFile {
  const parsed = matter(rawContent)
  const result = skillFrontmatterLenientSchema.safeParse(parsed.data)
  const frontmatter = result.success
    ? (result.data as SkillFrontmatter)
    : ({ name: '', description: '' } as SkillFrontmatter)

  return {
    frontmatter,
    content: parsed.content,
    rawContent,
  }
}

export function serializeSkillFile(skill: SkillFile): string {
  return matter.stringify(skill.content, skill.frontmatter)
}

export function validateFrontmatter(frontmatter: unknown): SkillFrontmatter {
  const result = skillFrontmatterSchema.parse(frontmatter)
  return result as SkillFrontmatter
}
