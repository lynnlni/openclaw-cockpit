import type { DiscoveredSkill } from '@/lib/skills/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Loader2, Check, Github } from 'lucide-react'

interface SkillDiscoverCardProps {
  skill: DiscoveredSkill
  onInstall: () => void
  installing: boolean
  disabled?: boolean
}

export function SkillDiscoverCard({ skill, onInstall, installing, disabled = false }: SkillDiscoverCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/20">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-foreground">{skill.name}</h3>
          {skill.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
              {skill.description}
            </p>
          )}
        </div>
        {skill.installed && (
          <Badge variant="secondary" className="shrink-0 text-xs">
            <Check className="mr-1 h-3 w-3" />
            已安装
          </Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Github className="h-3 w-3" />
          <span>{skill.repoOwner}/{skill.repoName}</span>
        </div>
        {skill.version && (
          <Badge variant="outline" className="text-xs">
            v{skill.version}
          </Badge>
        )}
        {skill.author && (
          <span className="text-xs text-muted-foreground">by {skill.author}</span>
        )}
        {skill.alwaysApply && (
          <Badge variant="outline" className="border-amber-500/30 text-xs text-amber-400">
            自动应用
          </Badge>
        )}
      </div>

      <div className="mt-3 flex justify-end border-t border-border pt-3">
        <Button
          size="sm"
          variant={skill.installed ? 'secondary' : 'default'}
          disabled={skill.installed || installing || disabled}
          onClick={onInstall}
        >
          {installing ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : skill.installed ? (
            <Check className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Download className="mr-1 h-3.5 w-3.5" />
          )}
          {skill.installed ? '已安装' : installing ? '安装中...' : '安装'}
        </Button>
      </div>
    </div>
  )
}
