'use client'

import { useState } from 'react'
import type { Machine } from '@/lib/machines/types'
import { Button } from '@/components/ui/button'
import { ConnectionTest } from '@/components/machines/connection-test'
import { Pencil, Trash2, Server, Wifi, Wand2, ChevronDown, ChevronRight } from 'lucide-react'

interface MachineListProps {
  machines: Machine[]
  onEdit: (machine: Machine) => void
  onDelete: (machine: Machine) => void
  onOpenOnboarding?: (machine: Machine) => void
  onRevokeToken?: (machine: Machine) => void
}

function formatPushTime(isoStr?: string): string {
  if (!isoStr) return '从未'
  const date = new Date(isoStr)
  if (isNaN(date.getTime())) return isoStr
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function GroupHeader({
  icon,
  label,
  count,
  collapsed,
  onToggle,
}: {
  icon: React.ReactNode
  label: string
  count: number
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 mb-2 group"
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
        {icon}
        {label}
        <span className="font-normal text-muted-foreground/50">({count})</span>
      </div>
      <div className="flex-1 border-t border-border" />
    </button>
  )
}

export function MachineList({ machines, onEdit, onDelete, onOpenOnboarding, onRevokeToken }: MachineListProps) {
  const [testingId, setTestingId] = useState<string | null>(null)
  const [sshCollapsed, setSshCollapsed] = useState(false)
  const [pushCollapsed, setPushCollapsed] = useState(false)

  const sshMachines = machines.filter((m) => m.connectionType !== 'push')
  const pushMachines = machines.filter((m) => m.connectionType === 'push')

  if (machines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12">
        <Server className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">暂无设备，请添加</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* SSH 直连 */}
      {sshMachines.length > 0 && (
        <div>
          <GroupHeader
            icon={<Server className="h-3.5 w-3.5" />}
            label="SSH 直连"
            count={sshMachines.length}
            collapsed={sshCollapsed}
            onToggle={() => setSshCollapsed((v) => !v)}
          />
          {!sshCollapsed && (
          <div className="rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">名称</th>
                  <th className="px-4 py-3 font-medium">主机</th>
                  <th className="px-4 py-3 font-medium">端口</th>
                  <th className="px-4 py-3 font-medium">用户名</th>
                  <th className="px-4 py-3 font-medium">认证方式</th>
                  <th className="px-4 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {sshMachines.map((machine) => (
                  <tr
                    key={machine.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Server className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                        {machine.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{machine.host}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{machine.port}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{machine.username}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {machine.authType === 'password' ? '密码' : '密钥'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <ConnectionTest
                          machineId={machine.id}
                          testing={testingId === machine.id}
                          onTestStart={() => setTestingId(machine.id)}
                          onTestEnd={() => setTestingId(null)}
                        />
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onEdit(machine)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDelete(machine)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}

      {/* 推送接入 */}
      {pushMachines.length > 0 && (
        <div>
          <GroupHeader
            icon={<Wifi className="h-3.5 w-3.5 text-sky-400" />}
            label="推送接入"
            count={pushMachines.length}
            collapsed={pushCollapsed}
            onToggle={() => setPushCollapsed((v) => !v)}
          />
          {!pushCollapsed && (
          <div className="rounded-lg border border-border">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">名称</th>
                  <th className="px-4 py-3 font-medium">令牌</th>
                  <th className="px-4 py-3 font-medium">最近版本</th>
                  <th className="px-4 py-3 font-medium">最近推送</th>
                  <th className="px-4 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {pushMachines.map((machine) => (
                  <tr
                    key={machine.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        <Wifi className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                        {machine.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {machine.pushToken ? (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                            已激活
                          </span>
                          {onRevokeToken && (
                            <button
                              type="button"
                              onClick={() => onRevokeToken(machine)}
                              className="text-xs text-muted-foreground/60 hover:text-destructive transition-colors"
                            >
                              吊销
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                          未设置
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {machine.lastPushVersion ? (
                        <span className="text-xs font-mono">{machine.lastPushVersion}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="text-xs">{formatPushTime(machine.lastPushAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {onOpenOnboarding && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-sky-400 hover:text-sky-300"
                            onClick={() => onOpenOnboarding(machine)}
                          >
                            <Wand2 className="h-3.5 w-3.5 mr-1" />
                            配置向导
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => onDelete(machine)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      )}
    </div>
  )
}
