'use client'

import type { InstalledSkill } from '@/lib/skills/types'
import { Button } from '@/components/ui/button'
import { SkillUpdateBadge } from '@/components/skills/skill-update-badge'
import { Pencil, Trash2, Activity, User, Tag, CheckCircle2, XCircle } from 'lucide-react'

interface SkillCardProps {
  skill: InstalledSkill
  onEdit: () => void
  onDelete: () => void
  onToggle: (enabled: boolean) => void
}

export function SkillCard({ skill, onEdit, onDelete, onToggle }: SkillCardProps) {
  const isEnabled = skill.enabled !== false

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium text-foreground">{skill.name}</h3>
            {skill.hasUpdate && <SkillUpdateBadge />}
            <button
              type="button"
              onClick={() => onToggle(!isEnabled)}
              className="ml-auto flex-shrink-0"
              title={isEnabled ? '已启用，点击禁用' : '已禁用，点击启用'}
            >
              {isEnabled ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
          {skill.version && (
            <p className="mt-0.5 text-xs text-muted-foreground">v{skill.version}</p>
          )}
        </div>
      </div>

      {skill.description && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
          {skill.description}
        </p>
      )}

      {!skill.description && skill.contentPreview && (
        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/70 italic">
          {skill.contentPreview}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {skill.author && (
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {skill.author}
          </span>
        )}
        {typeof skill.invocationCount === 'number' && (
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            调用 {skill.invocationCount} 次
          </span>
        )}
        {skill.source && skill.source !== 'local' && (
          <span className="truncate text-muted-foreground/70">
            {skill.source}
          </span>
        )}
      </div>

      {skill.tags && skill.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {skill.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-end gap-1 border-t border-border pt-3 mt-3">
        <Button variant="ghost" size="icon-xs" onClick={onEdit} title="编辑">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-xs" onClick={onDelete} title="删除">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  )
}
