import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Rocket, Settings, Terminal } from 'lucide-react'

interface QuickActionsProps {
  machineId: string
}

const actions = [
  { href: '/deploy', icon: Rocket, label: '部署管理' },
  { href: '/providers', icon: Settings, label: '配置' },
  { href: '/memory', icon: Terminal, label: '记忆管理' },
] as const

export function QuickActions({ machineId }: QuickActionsProps) {
  void machineId

  return (
    <div className="flex items-center gap-1">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Tooltip key={action.href}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-xs" asChild>
                <Link href={action.href}>
                  <Icon className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{action.label}</p>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
