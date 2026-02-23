'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { useMachine } from '@/store/machine-context'
import { useSkills } from '@/hooks/use-skills'
import { useSkillDiscovery } from '@/hooks/use-skill-discovery'
import { useSkillRepos } from '@/hooks/use-skill-repos'
import { SkillList } from '@/components/skills/skill-list'
import { SkillDiscovery } from '@/components/skills/skill-discovery'
import { SkillRepoManager } from '@/components/skills/skill-repo-manager'
import { SkillCreateDialog } from '@/components/skills/skill-create-dialog'
import { SkillEditor } from '@/components/skills/skill-editor'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus, Settings2 } from 'lucide-react'
import type { InstalledSkill, DiscoveredSkill } from '@/lib/skills/types'
import type { FrontmatterData } from '@/components/skills/frontmatter-form'

type Tab = 'installed' | 'discover' | 'repos'

interface EditingState {
  skill: InstalledSkill
  frontmatter: FrontmatterData
  content: string
}

interface ApiBody {
  success: boolean
  data?: unknown
  error?: string
}

async function safeFetch(
  url: string,
  options?: RequestInit
): Promise<ApiBody> {
  const res = await fetch(url, options)
  const body: ApiBody = await res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }))
  if (!res.ok || !body.success) {
    throw new Error(body.error ?? `请求失败: ${res.status}`)
  }
  return body
}

export default function SkillsPage() {
  const { selectedMachineId } = useMachine()
  const { data: skills, isLoading: skillsLoading, mutate: mutateSkills } = useSkills(selectedMachineId ?? undefined)
  const { data: discovered, isLoading: discoverLoading, mutate: mutateDiscovery } = useSkillDiscovery(selectedMachineId ?? undefined)
  const { data: repos, mutate: mutateRepos } = useSkillRepos(selectedMachineId ?? undefined)

  const [activeTab, setActiveTab] = useState<Tab>(selectedMachineId ? 'installed' : 'discover')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<InstalledSkill | null>(null)
  const [installingName, setInstallingName] = useState<string | null>(null)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editSaving, setEditSaving] = useState(false)

  const handleToggle = useCallback(
    async (skill: InstalledSkill, enabled: boolean) => {
      if (!selectedMachineId) return
      try {
        await safeFetch(
          `/api/instances/${selectedMachineId}/skills/${encodeURIComponent(skill.name)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frontmatter: { enabled } }),
          }
        )
        await mutateSkills()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '切换状态失败')
      }
    },
    [selectedMachineId, mutateSkills]
  )

  const handleDelete = useCallback(async () => {
    if (!selectedMachineId || !deleteTarget) return
    try {
      await safeFetch(
        `/api/instances/${selectedMachineId}/skills/${encodeURIComponent(deleteTarget.name)}`,
        { method: 'DELETE' }
      )
      await mutateSkills()
      setDeleteTarget(null)
      toast.success(`已删除技能 "${deleteTarget.name}"`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败')
    }
  }, [selectedMachineId, deleteTarget, mutateSkills])

  const handleEdit = useCallback(
    async (skill: InstalledSkill) => {
      if (!selectedMachineId) return
      setEditLoading(true)
      try {
        const body = await safeFetch(
          `/api/instances/${selectedMachineId}/skills/${encodeURIComponent(skill.name)}`
        )
        const d = body.data as Record<string, unknown>
        setEditing({
          skill,
          frontmatter: {
            name: String(d.name ?? skill.name),
            description: String(d.description ?? ''),
            version: String(d.version ?? ''),
            tags: Array.isArray(d.tags) ? d.tags as string[] : [],
            enabled: d.enabled !== false,
          },
          content: String(d.content ?? ''),
        })
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '加载技能详情失败')
      } finally {
        setEditLoading(false)
      }
    },
    [selectedMachineId]
  )

  const handleEditSave = useCallback(
    async (frontmatter: FrontmatterData, content: string) => {
      if (!selectedMachineId || !editing) return
      setEditSaving(true)
      try {
        await safeFetch(
          `/api/instances/${selectedMachineId}/skills/${encodeURIComponent(editing.skill.name)}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frontmatter, content }),
          }
        )
        await mutateSkills()
        setEditing(null)
        toast.success('技能已保存')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '保存失败')
      } finally {
        setEditSaving(false)
      }
    },
    [selectedMachineId, editing, mutateSkills]
  )

  const handleInstall = useCallback(
    async (skill: DiscoveredSkill) => {
      if (!selectedMachineId) return
      setInstallingName(skill.name)
      try {
        await safeFetch(`/api/instances/${selectedMachineId}/skills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: skill.name,
            description: skill.description,
            repoOwner: skill.repoOwner,
            repoName: skill.repoName,
            repoBranch: skill.repoBranch,
            path: skill.path,
            alwaysApply: skill.alwaysApply,
          }),
        })
        await mutateSkills()
        await mutateDiscovery()
        toast.success(`已安装技能 "${skill.name}"`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '安装失败')
      } finally {
        setInstallingName(null)
      }
    },
    [selectedMachineId, mutateSkills, mutateDiscovery]
  )

  const handleCreate = useCallback(
    async (name: string, description: string) => {
      if (!selectedMachineId) return
      try {
        await safeFetch(`/api/instances/${selectedMachineId}/skills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description, repoOwner: 'local', repoName: 'manual', repoBranch: 'main', path: name }),
        })
        await mutateSkills()
        toast.success(`已创建技能 "${name}"`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '创建失败')
      }
    },
    [selectedMachineId, mutateSkills]
  )

  const handleAddRepo = useCallback(
    async (owner: string, name: string, branch: string, skillsPath: string | null) => {
      if (!selectedMachineId) return
      try {
        await safeFetch(`/api/instances/${selectedMachineId}/skills/repos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner, name, branch, skillsPath }),
        })
        await mutateRepos()
        await mutateDiscovery()
        toast.success('仓库已添加')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '添加仓库失败')
      }
    },
    [selectedMachineId, mutateRepos, mutateDiscovery]
  )

  const handleRemoveRepo = useCallback(
    async (owner: string, name: string) => {
      if (!selectedMachineId) return
      try {
        await safeFetch(`/api/instances/${selectedMachineId}/skills/repos`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner, name }),
        })
        await mutateRepos()
        await mutateDiscovery()
        toast.success('仓库已移除')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '移除仓库失败')
      }
    },
    [selectedMachineId, mutateRepos, mutateDiscovery]
  )

  const noMachine = !selectedMachineId

  // Show skill editor fullscreen when editing
  if (editing) {
    return (
      <SkillEditor
        skillName={editing.skill.name}
        initialFrontmatter={editing.frontmatter}
        initialContent={editing.content}
        onSave={handleEditSave}
        onBack={() => setEditing(null)}
        saving={editSaving}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">技能管理</h1>
          <p className="text-sm text-muted-foreground">
            从 GitHub 仓库发现、安装和管理技能
          </p>
        </div>
        {!noMachine && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            创建技能
          </Button>
        )}
      </div>

      <div className="flex gap-1 border-b border-border">
        {([
          { key: 'installed' as const, label: '已安装', requiresMachine: true },
          { key: 'discover' as const, label: '发现技能' },
          { key: 'repos' as const, label: '仓库设置' },
        ]).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            disabled={tab.requiresMachine && noMachine}
            className={cn(
              'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
              tab.requiresMachine && noMachine && 'cursor-not-allowed opacity-40',
            )}
          >
            {tab.key === 'repos' && <Settings2 className="mr-1 inline h-3.5 w-3.5" />}
            {tab.label}
            {tab.key === 'installed' && skills && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs">
                {skills.length}
              </span>
            )}
            {tab.key === 'discover' && discovered && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs">
                {discovered.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'installed' && !noMachine && (
        <div>
          {skillsLoading || editLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner text={editLoading ? '加载技能详情...' : '加载已安装技能...'} />
            </div>
          ) : (
            <SkillList
              skills={skills ?? []}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onToggle={handleToggle}
            />
          )}
        </div>
      )}

      {activeTab === 'discover' && (
        <div>
          {discoverLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner text="正在从 GitHub 仓库发现技能..." />
            </div>
          ) : (
            <SkillDiscovery
              skills={discovered ?? []}
              onInstall={handleInstall}
              installingName={installingName}
              machineSelected={!noMachine}
            />
          )}
        </div>
      )}

      {activeTab === 'repos' && (
        <SkillRepoManager
          repos={repos ?? []}
          onAdd={handleAddRepo}
          onRemove={handleRemoveRepo}
        />
      )}

      <SkillCreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除技能"
        description={`确定要删除技能 "${deleteTarget?.name ?? ''}" 吗？`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        destructive
        confirmLabel="删除"
      />
    </div>
  )
}
