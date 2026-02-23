'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMachine } from '@/store/machine-context'
import { MachineSwitcher } from '@/components/layout/machine-switcher'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutDashboard,
  Server,
  Rocket,
  FileJson,
  Sparkles,
  Archive,
  UserCircle,
  Heart,
  Brain,
  Calendar,
  Bot,
  Wrench,
  Play,
  Timer,
  Fingerprint,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/theme-toggle'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  requiresMachine?: boolean
}

const operationsItems: NavItem[] = [
  { label: '仪表盘', href: '/dashboard', icon: LayoutDashboard },
  { label: '机器管理', href: '/machines', icon: Server },
  { label: '部署管理', href: '/deploy', icon: Rocket },
]

const workspaceItems: NavItem[] = [
  { label: '核心配置', href: '/workspace/config', icon: FileJson, requiresMachine: true },
  { label: '身份信息', href: '/workspace/identity', icon: Fingerprint, requiresMachine: true },
  { label: '性格设定', href: '/workspace/soul', icon: Heart, requiresMachine: true },
  { label: '记忆索引', href: '/workspace/memory-index', icon: Brain, requiresMachine: true },
  { label: '每日记忆', href: '/workspace/daily-memory', icon: Calendar, requiresMachine: true },
  { label: '用户档案', href: '/workspace/user', icon: UserCircle, requiresMachine: true },
  { label: 'Agent 配置', href: '/workspace/agents', icon: Bot, requiresMachine: true },
  { label: '工具配置', href: '/workspace/tools', icon: Wrench, requiresMachine: true },
  { label: '启动引导', href: '/workspace/bootstrap', icon: Play, requiresMachine: true },
  { label: '心跳配置', href: '/workspace/heartbeat', icon: Timer, requiresMachine: true },
]

const manageItems: NavItem[] = [
  { label: '技能管理', href: '/skills', icon: Sparkles, requiresMachine: true },
  { label: '备份恢复', href: '/backups', icon: Archive, requiresMachine: true },
]

function NavLink({ item, disabled }: { item: NavItem; disabled: boolean }) {
  const pathname = usePathname()
  const isActive = pathname === item.href
  const Icon = item.icon

  const linkContent = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </div>
  )

  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>{linkContent}</div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>请先选择机器</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link href={item.href}>
      {linkContent}
    </Link>
  )
}

function NavSection({
  label,
  items,
  noMachine,
}: {
  label: string
  items: NavItem[]
  noMachine: boolean
}) {
  return (
    <div className="mb-3">
      <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="mt-1 space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            disabled={item.requiresMachine === true && noMachine}
          />
        ))}
      </div>
    </div>
  )
}

export function Sidebar() {
  const { selectedMachineId } = useMachine()
  const noMachine = selectedMachineId === null

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-lg font-bold tracking-tight text-foreground">
          OpenClaw Cockpit
        </span>
      </div>

      <MachineSwitcher />

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <NavSection label="运维" items={operationsItems} noMachine={noMachine} />
        <NavSection label="工作区" items={workspaceItems} noMachine={noMachine} />
        <NavSection label="管理" items={manageItems} noMachine={noMachine} />
      </nav>

      <div className="border-t border-border px-2 py-2">
        <ThemeToggle />
      </div>
    </aside>
  )
}
