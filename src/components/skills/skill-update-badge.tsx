import { Badge } from '@/components/ui/badge'
import { ArrowUp } from 'lucide-react'

export function SkillUpdateBadge() {
  return (
    <Badge variant="default" className="gap-0.5 text-xs">
      <ArrowUp className="h-2.5 w-2.5" />
      更新
    </Badge>
  )
}
