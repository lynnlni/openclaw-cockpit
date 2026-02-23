'use client'

import { useState, useCallback } from 'react'
import type { SkillRepo } from '@/lib/skills/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, Github } from 'lucide-react'

interface SkillRepoManagerProps {
  repos: SkillRepo[]
  onAdd: (owner: string, name: string, branch: string, skillsPath: string | null) => void
  onRemove: (owner: string, name: string) => void
}

const inputClass =
  'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export function SkillRepoManager({ repos, onAdd, onRemove }: SkillRepoManagerProps) {
  const [owner, setOwner] = useState('')
  const [name, setName] = useState('')
  const [branch, setBranch] = useState('main')
  const [skillsPath, setSkillsPath] = useState('')

  const handleAdd = useCallback(() => {
    if (owner.trim() && name.trim()) {
      onAdd(
        owner.trim(),
        name.trim(),
        branch.trim() || 'main',
        skillsPath.trim() || null
      )
      setOwner('')
      setName('')
      setBranch('main')
      setSkillsPath('')
    }
  }, [owner, name, branch, skillsPath, onAdd])

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">技能仓库</h4>

      <div className="space-y-2">
        {repos.map((repo) => (
          <div
            key={`${repo.owner}/${repo.name}`}
            className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Github className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {repo.owner}/{repo.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {repo.branch}
                </Badge>
                {repo.skillsPath && (
                  <span className="text-xs text-muted-foreground">
                    /{repo.skillsPath}
                  </span>
                )}
                {repo.isDefault && (
                  <Badge variant="secondary" className="text-xs">
                    默认
                  </Badge>
                )}
              </div>
            </div>
            {!repo.isDefault && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onRemove(repo.owner, repo.name)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-md border border-dashed border-border p-3">
        <div className="grid grid-cols-2 gap-2">
          <input
            className={inputClass}
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="GitHub 用户/组织 (owner)"
          />
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="仓库名 (repo name)"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            className={inputClass}
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            placeholder="分支 (默认 main)"
          />
          <input
            className={inputClass}
            value={skillsPath}
            onChange={(e) => setSkillsPath(e.target.value)}
            placeholder="技能子目录 (可选)"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleAdd} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1" />
          添加仓库
        </Button>
      </div>
    </div>
  )
}
