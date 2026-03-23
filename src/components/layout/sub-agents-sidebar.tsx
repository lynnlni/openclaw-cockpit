'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Bot,
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
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
const MAIN_AGENT_FILE = 'workspace/AGENTS.md'
const REGISTRY_PATH = 'workspace/agents/registry'
const FILE_LABELS: Record<string, string> = {
  'AGENTS.md': 'Agent 规则',
  'IDENTITY.md': '身份信息',
  'SOUL.md': '性格设定',
  'MEMORY.md': '记忆索引',
  'USER.md': '用户档案',
  'TOOLS.md': '工具配置',
  'BOOTSTRAP.md': '启动引导',
  'HEARTBEAT.md': '心跳配置',
  'jobs.json': '定时任务',
  'registry.json': '注册表索引',
}

function toEditorFilePath(entryPath: string, openclawPath: string): string {
  return entryPath.startsWith(openclawPath + '/')
    ? entryPath.slice(openclawPath.length + 1)
    : entryPath
}

function toWorkspaceQueryPath(pathValue: string, openclawPath: string): string {
  return pathValue.startsWith(openclawPath + '/')
    ? pathValue.slice(openclawPath.length + 1)
    : pathValue
}

function getAgentTreeRoot(agent: AgentEntry): string | null {
  if (agent.workspace?.trim()) return agent.workspace
  if (agent.agentDir?.trim()) return agent.agentDir
  return null
}

function buildFileHref(filePath: string): string {
  return `/workspace/agents?file=${encodeURIComponent(filePath)}`
}

function getDisplayName(entry: FileEntry): string {
  return FILE_LABELS[entry.name] ?? entry.name
}

function TreeItem({
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
  const queryFilePath = toEditorFilePath(entry.path, openclawPath)
  const isActive = queryFilePath === activeFile
  const displayName = getDisplayName(entry)

  if (isDir) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="group flex w-full items-center gap-1.5 rounded-md py-1 text-left text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          style={{ paddingLeft: `${16 + depth * 10}px`, paddingRight: '8px' }}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
          )}
          {expanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          )}
          <span className="truncate leading-5">{displayName}</span>
        </button>
        {expanded && (
          <div className="ml-4 border-l border-border/45 pl-1.5">
            {entry.children?.map((child) => (
              <TreeItem
                key={child.path}
                entry={child}
                depth={depth + 1}
                activeFile={activeFile}
                openclawPath={openclawPath}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={buildFileHref(queryFilePath)}
      className={cn(
        'flex w-full items-center gap-2 rounded-md py-1 text-[12px] transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
      )}
      style={{ paddingLeft: `${26 + depth * 10}px`, paddingRight: '8px' }}
    >
      <FileText className="h-3.5 w-3.5 shrink-0 text-blue-400" />
      <span className="truncate font-medium leading-5">{displayName}</span>
    </Link>
  )
}

function RegistryExpandable({
  machineId,
  openclawPath,
  activeFile,
}: {
  machineId: string
  openclawPath: string
  activeFile: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const { data: files, isLoading } = useWorkspaceFiles(
    expanded ? machineId : undefined,
    REGISTRY_PATH,
    true,
  )

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
        )}
        <Folder className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        <span className="truncate">注册表</span>
      </button>
      {expanded ? (
        <div className="ml-4 border-l border-border/45 pl-1.5">
          {isLoading ? (
            <p className="px-5 py-1 text-[11px] text-muted-foreground/50">加载中…</p>
          ) : !files?.length ? (
            <p className="px-5 py-1 text-[11px] text-muted-foreground/40">空</p>
          ) : (
            files.map((entry) => (
              <TreeItem
                key={entry.path}
                entry={entry}
                depth={0}
                activeFile={activeFile}
                openclawPath={openclawPath}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

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
  const rootPath = getAgentTreeRoot(agent)
  const queryPath = rootPath ? toWorkspaceQueryPath(rootPath, openclawPath) : undefined

  const { data: files, isLoading } = useWorkspaceFiles(
    expanded && queryPath ? machineId : undefined,
    queryPath,
    true,
    WORKSPACE_EXCLUDE,
  )

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left transition-colors hover:bg-secondary/60"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        )}
        <Bot className="h-3.5 w-3.5 shrink-0 text-blue-400" />
        <span className="truncate text-[12px] font-medium leading-5 text-foreground">
          {agent.name}
        </span>
      </button>
      {expanded ? (
        <div className="ml-4 border-l border-border/45 pl-1.5">
          {!rootPath ? (
            <p className="px-5 py-1 text-[11px] text-muted-foreground/40">未配置 workspace</p>
          ) : isLoading ? (
            <p className="px-5 py-1 text-[11px] text-muted-foreground/50">加载中…</p>
          ) : !files?.length ? (
            <p className="px-5 py-1 text-[11px] text-muted-foreground/40">空</p>
          ) : (
            files.map((entry) => (
              <TreeItem
                key={entry.path}
                entry={entry}
                depth={0}
                activeFile={activeFile}
                openclawPath={openclawPath}
              />
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

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
  const subAgents = agents.filter((agent) => agent.id !== 'main')
  const mainActive = activeFile === MAIN_AGENT_FILE

  return (
    <div className="mb-3">
      <div className="px-3 pb-1">
        <span className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground/60">
          子代理配置
        </span>
      </div>

      <div className="space-y-1">
        <Link
          href={buildFileHref(MAIN_AGENT_FILE)}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
            mainActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
          )}
        >
          <FileText className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate leading-5">主配置</span>
        </Link>

        <RegistryExpandable
          machineId={machineId}
          openclawPath={openclawPath}
          activeFile={activeFile}
        />

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
