'use client'

import type { InstalledSkill } from '@/lib/skills/types'
import { SkillCard } from '@/components/skills/skill-card'
import { Sparkles } from 'lucide-react'

interface SkillListProps {
  skills: InstalledSkill[]
  onEdit: (skill: InstalledSkill) => void
  onDelete: (skill: InstalledSkill) => void
  onToggle: (skill: InstalledSkill, enabled: boolean) => void
}

export function SkillList({ skills, onEdit, onDelete, onToggle }: SkillListProps) {
  if (skills.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12">
        <Sparkles className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">暂无已安装的技能</p>
        <p className="text-xs text-muted-foreground/70">
          技能目录为空，可从"发现技能"安装或手动创建
        </p>
      </div>
    )
  }

  const enabledCount = skills.filter((s) => s.enabled !== false).length
  const totalInvocations = skills.reduce(
    (sum, s) => sum + (s.invocationCount ?? 0),
    0
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          共 <strong className="text-foreground">{skills.length}</strong> 个技能
        </span>
        <span>
          启用 <strong className="text-green-500">{enabledCount}</strong> 个
        </span>
        {totalInvocations > 0 && (
          <span>
            总调用 <strong className="text-foreground">{totalInvocations}</strong> 次
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => (
          <SkillCard
            key={skill.name}
            skill={skill}
            onEdit={() => onEdit(skill)}
            onDelete={() => onDelete(skill)}
            onToggle={(enabled) => onToggle(skill, enabled)}
          />
        ))}
      </div>
    </div>
  )
}
