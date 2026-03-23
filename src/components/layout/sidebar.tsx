'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMachine } from '@/store/machine-context'
import { useMachines } from '@/hooks/use-machines'
import { MachineSwitcher } from '@/components/layout/machine-switcher'
import { cn } from '@/lib/utils'
import { SSH_REMOTE_ACCESS_ENABLED } from '@/lib/ssh/feature'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutDashboard,
  Server,
  FileJson,
  Sparkles,
  Archive,
  UserCircle,
  Heart,
  Brain,
  Calendar,
  Wrench,
  Play,
  Timer,
  Fingerprint,
  Power,
  BarChart2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { SubAgentsSection } from '@/components/layout/sub-agents-sidebar'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  requiresMachine?: boolean
  sshOnly?: boolean
}

const operationsItems: NavItem[] = [
  { label: '仪表盘', href: '/dashboard', icon: LayoutDashboard },
  { label: '消息分析', href: '/analytics', icon: BarChart2, requiresMachine: true, sshOnly: true },
  { label: '设备管理', href: '/machines', icon: Server },
]

const workspaceItems: NavItem[] = [
  { label: '核心配置', href: '/workspace/config', icon: FileJson, requiresMachine: true, sshOnly: true },
  { label: '身份信息', href: '/workspace/identity', icon: Fingerprint, requiresMachine: true, sshOnly: true },
  { label: '性格设定', href: '/workspace/soul', icon: Heart, requiresMachine: true, sshOnly: true },
  { label: '记忆索引', href: '/workspace/memory-index', icon: Brain, requiresMachine: true, sshOnly: true },
  { label: '每日记忆', href: '/workspace/daily-memory', icon: Calendar, requiresMachine: true, sshOnly: true },
  { label: '用户档案', href: '/workspace/user', icon: UserCircle, requiresMachine: true, sshOnly: true },
  { label: '定时任务', href: '/workspace/jobs', icon: FileJson, requiresMachine: true, sshOnly: true },
  { label: '工具配置', href: '/workspace/tools', icon: Wrench, requiresMachine: true, sshOnly: true },
  { label: '网关启动', href: '/workspace/boot', icon: Power, requiresMachine: true, sshOnly: true },
  { label: '启动引导', href: '/workspace/bootstrap', icon: Play, requiresMachine: true, sshOnly: true },
  { label: '心跳配置', href: '/workspace/heartbeat', icon: Timer, requiresMachine: true, sshOnly: true },
]

const manageItems: NavItem[] = [
  { label: '技能管理', href: '/skills', icon: Sparkles, requiresMachine: true, sshOnly: true },
  { label: '备份恢复', href: '/backups', icon: Archive, requiresMachine: true },
]

function NavLink({ item, disabled }: { item: NavItem; disabled: boolean }) {
  const pathname = usePathname()
  const isActive = pathname === item.href
  const Icon = item.icon

  const linkContent = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
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
  isPush,
}: {
  label: string
  items: NavItem[]
  noMachine: boolean
  isPush: boolean
}) {
  const visibleItems = items.filter((item) =>
    SSH_REMOTE_ACCESS_ENABLED
      ? !(item.sshOnly && isPush)
      : !item.sshOnly,
  )
  if (visibleItems.length === 0) return null

  return (
    <div className="mb-3">
      <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
        {label}
      </span>
      <div className="mt-1 space-y-0.5">
        {visibleItems.map((item) => (
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
  const pathname = usePathname()
  const { selectedMachineId } = useMachine()
  const { data: machines } = useMachines()
  const noMachine = selectedMachineId === null
  const selectedMachine = machines?.find((m) => m.id === selectedMachineId)
  const isPush = selectedMachine?.connectionType === 'push'

  // Don't show sidebar on login/change-password pages
  if (pathname === '/login' || pathname === '/change-password') {
    return null
  }

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="flex h-14 items-center border-b border-border px-4">
        <span className="text-lg font-bold tracking-tight text-foreground">
          OpenClaw Cockpit
        </span>
      </div>

      <MachineSwitcher />

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <NavSection label="运维" items={operationsItems} noMachine={noMachine} isPush={isPush ?? false} />
        <NavSection label="工作区" items={workspaceItems} noMachine={noMachine} isPush={isPush ?? false} />
        {SSH_REMOTE_ACCESS_ENABLED && !noMachine && !(isPush ?? false) && selectedMachineId && selectedMachine && (
          <SubAgentsSection
            machineId={selectedMachineId}
            openclawPath={selectedMachine.openclawPath ?? ''}
          />
        )}
        <NavSection label="管理" items={manageItems} noMachine={noMachine} isPush={isPush ?? false} />
      </nav>

      <div className="border-t border-border px-2 py-2">
        <ThemeToggle />
      </div>
    </aside>
  )
}
