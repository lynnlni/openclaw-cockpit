'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  FolderOpen,
  Bot,
} from 'lucide-react'

import { useConfig } from '@/hooks/use-config'
import { useWorkspaceFiles } from '@/hooks/use-workspace-files'
import { cn } from '@/lib/utils'
import type { FileEntry } from '@/lib/ssh/types'

interface AgentEntry {
  id: string
  name: string
  workspace?: string
  agentDir?: string
}

const WORKSPACE_EXCLUDE = ['skills', 'node_modules', 'agents']

// ─── Single file/dir tree item ─────────────────────────────────────────────

function FileItem({
  entry,
  depth,
  activeFile,
  openclawPath,
}: {
  entry: FileEntry
  depth: number
  activeFile: string | null
  openclawPath: string
}) {
  const [expanded, setExpanded] = useState(true)
  const isDir = entry.type === 'directory'

  // Absolute paths from SSH won't match openclawPath (tilde), so pass as-is
  const filePath = entry.path.startsWith(openclawPath + '/')
    ? entry.path.slice(openclawPath.length + 1)
    : entry.path

  const isActive = filePath === activeFile

  return (
    <div>
      {isDir ? (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-1 rounded py-0.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-left"
          style={{ paddingLeft: `${10 + depth * 10}px`, paddingRight: '6px' }}
        >
          {expanded
            ? <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-60" />
            : <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-60" />}
          {expanded
            ? <FolderOpen className="h-3 w-3 shrink-0 text-amber-400" />
            : <Folder className="h-3 w-3 shrink-0 text-amber-400" />}
          <span className="truncate">{entry.name}</span>
        </button>
      ) : (
        <Link
          href={`/workspace/agents?file=${encodeURIComponent(filePath)}`}
          className={cn(
            'flex w-full items-center gap-1 rounded py-0.5 text-xs transition-colors',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}
          style={{ paddingLeft: `${10 + depth * 10}px`, paddingRight: '6px' }}
        >
          <span className="w-2.5 shrink-0" />
          <FileText className="h-3 w-3 shrink-0 text-blue-400" />
          <span className="truncate">{entry.name}</span>
        </Link>
      )}
      {isDir && expanded && entry.children?.map((child) => (
        <FileItem
          key={child.path}
          entry={child}
          depth={depth + 1}
          activeFile={activeFile}
          openclawPath={openclawPath}
        />
      ))}
    </div>
  )
}

// ─── Registry expandable ───────────────────────────────────────────────────

function RegistryExpandable({
  machineId,
  registryPath,
  openclawPath,
  activeFile,
}: {
  machineId: string
  registryPath: string | null
  openclawPath: string
  activeFile: string | null
}) {
  const [expanded, setExpanded] = useState(false)

  const { data: absFiles, isLoading: absLoading } = useWorkspaceFiles(
    expanded && registryPath ? machineId : undefined,
    registryPath ?? undefined,
    true,
  )
  const { data: relFiles, isLoading: relLoading } = useWorkspaceFiles(
    expanded ? machineId : undefined,
    'workspace/agents/registry',
    true,
  )

  const isLoading = absLoading || relLoading
  const seen = new Set<string>()
  const files = [...(absFiles ?? []), ...(relFiles ?? [])].filter((f) => {
    if (seen.has(f.path)) return false
    seen.add(f.path)
    return true
  })

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground text-left"
      >
        {expanded
          ? <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
          : <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />}
        <Folder className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        <span className="truncate text-sm">Registry</span>
      </button>
      {expanded && (
        <div className="max-h-48 overflow-y-auto">
          {isLoading ? (
            <p className="px-6 py-1 text-xs text-muted-foreground/50">加载中…</p>
          ) : !files.length ? (
            <p className="px-6 py-1 text-xs text-muted-foreground/40">空</p>
          ) : (
            files.map((entry) => (
              <FileItem
                key={entry.path}
                entry={entry}
                depth={0}
                activeFile={activeFile}
                openclawPath={openclawPath}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Per-agent expandable ──────────────────────────────────────────────────

function AgentExpandable({
  agent,
  machineId,
  openclawPath,
  activeFile,
}: {
  agent: AgentEntry
  machineId: string
  openclawPath: string
  activeFile: string | null
}) {
  const [expanded, setExpanded] = useState(false)

  const relPath = agent.workspace?.startsWith(openclawPath + '/')
    ? agent.workspace.slice(openclawPath.length + 1)
    : agent.workspace

  const { data: files, isLoading } = useWorkspaceFiles(
    expanded && relPath ? machineId : undefined,
    relPath,
    true,
    WORKSPACE_EXCLUDE,
  )

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground text-left"
      >
        {expanded
          ? <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
          : <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />}
        <Bot className="h-3.5 w-3.5 shrink-0 text-blue-400" />
        <span className="truncate text-sm">{agent.name}</span>
      </button>
      {expanded && (
        <div className="max-h-48 overflow-y-auto">
          {!relPath ? (
            <p className="px-6 py-1 text-xs text-muted-foreground/40">未配置 workspace</p>
          ) : isLoading ? (
            <p className="px-6 py-1 text-xs text-muted-foreground/50">加载中…</p>
          ) : !files?.length ? (
            <p className="px-6 py-1 text-xs text-muted-foreground/40">空</p>
          ) : (
            files.map((entry) => (
              <FileItem
                key={entry.path}
                entry={entry}
                depth={0}
                activeFile={activeFile}
                openclawPath={openclawPath}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Inner section (needs useSearchParams → wrapped in Suspense) ───────────

function SubAgentsSectionInner({
  machineId,
  openclawPath,
}: {
  machineId: string
  openclawPath: string
}) {
  const searchParams = useSearchParams()
  const activeFile = searchParams.get('file')

  const { data: config } = useConfig(machineId)
  const agents: AgentEntry[] =
    ((config as Record<string, unknown>)?.agents as { list?: AgentEntry[] })?.list ?? []
  const subAgents = agents.filter((a) => a.id !== 'main')

  const firstAgentDir = agents.find((a) => a.agentDir)?.agentDir
  const registryPath = firstAgentDir
    ? firstAgentDir.split('/').slice(0, -2).join('/') + '/registry'
    : null

  const mainActive = activeFile === 'workspace/AGENTS.md'

  return (
    <div className="mb-3">
      <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        子Agents
      </span>
      <div className="mt-1 space-y-0.5">
        {/* 主配置 */}
        <Link
          href="/workspace/agents?file=workspace%2FAGENTS.md"
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            mainActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span>主配置</span>
        </Link>

        {/* Registry */}
        <RegistryExpandable
          machineId={machineId}
          registryPath={registryPath}
          openclawPath={openclawPath}
          activeFile={activeFile}
        />

        {/* Per sub-agent */}
        {subAgents.map((agent) => (
          <AgentExpandable
            key={agent.id}
            agent={agent}
            machineId={machineId}
            openclawPath={openclawPath}
            activeFile={activeFile}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Public export ─────────────────────────────────────────────────────────

export function SubAgentsSection({
  machineId,
  openclawPath,
}: {
  machineId: string
  openclawPath: string
}) {
  return (
    <Suspense fallback={null}>
      <SubAgentsSectionInner machineId={machineId} openclawPath={openclawPath} />
    </Suspense>
  )
}
