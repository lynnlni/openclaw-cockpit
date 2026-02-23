import type { SkillRepo, DiscoveredSkill } from './types'

interface GitHubTreeItem {
  path: string
  mode: string
  type: string
  sha: string
  url: string
}

interface GitHubTreeResponse {
  sha: string
  url: string
  tree: GitHubTreeItem[]
  truncated: boolean
}

interface SkillMdFrontmatter {
  name?: string
  description?: string
  version?: string
  author?: string
  alwaysApply?: boolean
  license?: string
}

function parseFrontmatter(content: string): SkillMdFrontmatter {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return {}

  const yaml = match[1]
  const result: Record<string, string | boolean> = {}

  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const key = line.slice(0, colonIdx).trim()
    let value: string | boolean = line.slice(colonIdx + 1).trim()

    if (value === 'true') value = true
    else if (value === 'false') value = false
    else if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    result[key] = value
  }

  return result as SkillMdFrontmatter
}

export async function discoverSkillsFromRepo(
  repo: SkillRepo
): Promise<DiscoveredSkill[]> {
  if (!repo.enabled) return []

  const basePath = repo.skillsPath ?? ''
  const treePath = basePath ? `${basePath}` : ''

  const treeUrl = `https://api.github.com/repos/${repo.owner}/${repo.name}/git/trees/${repo.branch}?recursive=1`

  const treeRes = await fetch(treeUrl, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'openclaw-cockpit',
    },
    next: { revalidate: 300 },
  })

  if (!treeRes.ok) {
    throw new Error(
      `GitHub API error for ${repo.owner}/${repo.name}: ${treeRes.status}`
    )
  }

  const treeData: GitHubTreeResponse = await treeRes.json()

  const skillMdPaths = treeData.tree.filter((item) => {
    if (item.type !== 'blob') return false
    const path = item.path

    if (treePath && !path.startsWith(`${treePath}/`)) return false

    const relativePath = treePath ? path.slice(treePath.length + 1) : path
    const parts = relativePath.split('/')

    return parts.length === 2 && parts[1] === 'SKILL.md'
  })

  const skills: DiscoveredSkill[] = []

  const fetchPromises = skillMdPaths.map(async (item) => {
    const relativePath = treePath
      ? item.path.slice(treePath.length + 1)
      : item.path
    const skillName = relativePath.split('/')[0]

    try {
      const contentUrl = `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${repo.branch}/${item.path}`

      const contentRes = await fetch(contentUrl, {
        headers: { 'User-Agent': 'openclaw-cockpit' },
        next: { revalidate: 300 },
      })

      if (!contentRes.ok) {
        return {
          name: skillName,
          description: '',
          repoOwner: repo.owner,
          repoName: repo.name,
          repoBranch: repo.branch,
          path: item.path.replace('/SKILL.md', ''),
          installed: false,
        }
      }

      const content = await contentRes.text()
      const frontmatter = parseFrontmatter(content)

      return {
        name: frontmatter.name ?? skillName,
        description: frontmatter.description ?? '',
        version: frontmatter.version,
        author: frontmatter.author,
        alwaysApply: frontmatter.alwaysApply,
        license: typeof frontmatter.license === 'string' ? frontmatter.license : undefined,
        repoOwner: repo.owner,
        repoName: repo.name,
        repoBranch: repo.branch,
        path: item.path.replace('/SKILL.md', ''),
        installed: false,
      }
    } catch {
      return {
        name: skillName,
        description: '',
        repoOwner: repo.owner,
        repoName: repo.name,
        repoBranch: repo.branch,
        path: item.path.replace('/SKILL.md', ''),
        installed: false,
      }
    }
  })

  const results = await Promise.all(fetchPromises)
  skills.push(...results)

  return skills
}

export async function discoverAllSkills(
  repos: SkillRepo[]
): Promise<DiscoveredSkill[]> {
  const enabledRepos = repos.filter((r) => r.enabled)

  const results = await Promise.allSettled(
    enabledRepos.map((repo) => discoverSkillsFromRepo(repo))
  )

  const allSkills: DiscoveredSkill[] = []

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allSkills.push(...result.value)
    }
  }

  return allSkills
}
