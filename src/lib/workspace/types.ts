export interface WorkspaceStructure {
  path: string
  configPath: string
  skillsDir: string
  memoryDir: string
  knowledgeDir: string
}

export interface SkillFrontmatter {
  name: string
  description: string
  version?: string
  author?: string
  enabled?: boolean
  alwaysApply?: boolean
  tags?: string[]
  [key: string]: unknown
}

export interface SkillFile {
  frontmatter: SkillFrontmatter
  content: string
  rawContent: string
}

export interface DailyMemory {
  date: string
  filename: string
  path: string
}
