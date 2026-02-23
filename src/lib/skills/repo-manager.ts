import type { SkillRepo } from './types'

const DEFAULT_REPOS: readonly SkillRepo[] = [
  {
    owner: 'anthropics',
    name: 'skills',
    branch: 'main',
    enabled: true,
    skillsPath: null,
    isDefault: true,
  },
  {
    owner: 'ComposioHQ',
    name: 'awesome-claude-skills',
    branch: 'main',
    enabled: true,
    skillsPath: null,
    isDefault: true,
  },
  {
    owner: 'cexll',
    name: 'myclaude',
    branch: 'master',
    enabled: true,
    skillsPath: 'skills',
    isDefault: true,
  },
]

export function getDefaultRepos(): SkillRepo[] {
  return [...DEFAULT_REPOS]
}

export function addRepo(repos: SkillRepo[], newRepo: SkillRepo): SkillRepo[] {
  const exists = repos.some(
    (r) => r.owner === newRepo.owner && r.name === newRepo.name
  )
  if (exists) {
    throw new Error(`Repo ${newRepo.owner}/${newRepo.name} already exists`)
  }
  return [...repos, newRepo]
}

export function removeRepo(repos: SkillRepo[], owner: string, name: string): SkillRepo[] {
  return repos.filter((r) => !(r.owner === owner && r.name === name))
}

export function toggleRepo(repos: SkillRepo[], owner: string, name: string, enabled: boolean): SkillRepo[] {
  return repos.map((r) =>
    r.owner === owner && r.name === name ? { ...r, enabled } : r
  )
}

export function repoToUrl(repo: SkillRepo): string {
  return `https://github.com/${repo.owner}/${repo.name}`
}

export function repoId(repo: SkillRepo): string {
  return `${repo.owner}/${repo.name}`
}
