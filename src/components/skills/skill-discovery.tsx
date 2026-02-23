import type { DiscoveredSkill } from '@/lib/skills/types'
import { SkillDiscoverCard } from '@/components/skills/skill-discover-card'
import { Search, Info } from 'lucide-react'

interface SkillDiscoveryProps {
  skills: DiscoveredSkill[]
  onInstall: (skill: DiscoveredSkill) => void
  installingName: string | null
  machineSelected?: boolean
}

export function SkillDiscovery({ skills, onInstall, installingName, machineSelected = false }: SkillDiscoveryProps) {
  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12">
        <Search className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">未发现可用技能</p>
        <p className="text-xs text-muted-foreground">请检查仓库设置中是否配置了正确的 GitHub 仓库</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!machineSelected && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <Info className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-xs text-amber-300">
            请先在侧边栏选择一台机器，然后才能安装技能
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <SkillDiscoverCard
            key={`${skill.repoOwner}/${skill.repoName}/${skill.name}`}
            skill={skill}
            onInstall={() => onInstall(skill)}
            installing={installingName === skill.name}
            disabled={!machineSelected}
          />
        ))}
      </div>
    </div>
  )
}
