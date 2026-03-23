'use client'

import type { ComponentType, ReactNode } from 'react'
import { Bot, Braces, Cable, Database, Settings2 } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  AgentConfig,
  AgentsConfig,
  ChannelConfig,
  MCPServerConfig,
  OpenClawConfig,
  ProviderConfig,
} from '@/lib/config/types'

interface StructuredConfigEditorProps {
  value: OpenClawConfig
  onChange: (next: OpenClawConfig) => void
}

const textareaClassName =
  'flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'

function formatLines(values?: string[]): string {
  return values?.join('\n') ?? ''
}

function parseLines(value: string): string[] | undefined {
  const lines = value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  return lines.length > 0 ? lines : undefined
}

function formatEntries(values?: Record<string, string>): string {
  return Object.entries(values ?? {})
    .map(([key, val]) => `${key}=${val}`)
    .join('\n')
}

function parseEntries(value: string): Record<string, string> | undefined {
  const entries = value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf('=')
      if (separatorIndex === -1) {
        return [line, ''] as const
      }
      return [line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim()] as const
    })
    .filter(([key]) => key.length > 0)

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

function hasOwn(value: unknown, key: string): boolean {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && Object.prototype.hasOwnProperty.call(value, key)
}

function asObject<T extends object>(value: unknown): Partial<T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Partial<T>
}

function asRecord<T>(value: unknown): Record<string, T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, T>
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function asStringRecord(value: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(asRecord<unknown>(value)).filter(([, itemValue]) => typeof itemValue === 'string')
  ) as Record<string, string>
}

function asChannels(value: unknown): ChannelConfig[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is ChannelConfig => Boolean(item) && typeof item === 'object')
}

function asAgents(value: unknown): AgentConfig[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is AgentConfig => Boolean(item) && typeof item === 'object')
}

function normalizeProvider(value: unknown): ProviderConfig {
  const provider = asObject<ProviderConfig>(value)

  return {
    ...provider,
    apiKey: typeof provider.apiKey === 'string' ? provider.apiKey : '',
    baseUrl: typeof provider.baseUrl === 'string' ? provider.baseUrl : undefined,
    apiType: typeof provider.apiType === 'string' ? provider.apiType : undefined,
    models: asStringArray(provider.models),
  }
}

function normalizeChannel(value: unknown): ChannelConfig {
  const channel = asObject<ChannelConfig>(value)

  return {
    ...channel,
    type: typeof channel.type === 'string' ? channel.type : '',
    enabled: channel.enabled === true,
  }
}

function normalizeMcpServer(value: unknown): MCPServerConfig {
  const server = asObject<MCPServerConfig>(value)

  return {
    ...server,
    transport:
      server.transport === 'http' || server.transport === 'sse' || server.transport === 'stdio'
        ? server.transport
        : 'stdio',
    enabled: server.enabled === true,
    command: typeof server.command === 'string' ? server.command : undefined,
    args: asStringArray(server.args),
    env: asStringRecord(server.env),
    url: typeof server.url === 'string' ? server.url : undefined,
    headers: asStringRecord(server.headers),
  }
}

function normalizeAgent(value: unknown): AgentConfig {
  const agent = asObject<AgentConfig>(value)

  return {
    ...agent,
    id: typeof agent.id === 'string' ? agent.id : undefined,
    name: typeof agent.name === 'string' ? agent.name : undefined,
    workspace: typeof agent.workspace === 'string' ? agent.workspace : undefined,
    agentDir: typeof agent.agentDir === 'string' ? agent.agentDir : undefined,
  }
}

function updateProviderValue(
  provider: ProviderConfig,
  field: 'apiKey' | 'apiType' | 'baseUrl' | 'models',
  nextValue: string | string[] | undefined
): ProviderConfig {
  switch (field) {
    case 'apiKey':
      return {
        ...provider,
        apiKey: typeof nextValue === 'string' ? nextValue : '',
      }
    case 'apiType':
      return {
        ...provider,
        apiType: typeof nextValue === 'string' ? nextValue : undefined,
      }
    case 'baseUrl':
      return {
        ...provider,
        baseUrl: typeof nextValue === 'string' ? nextValue : undefined,
      }
    case 'models':
      return {
        ...provider,
        models: Array.isArray(nextValue) ? nextValue : undefined,
      }
  }
}

function updateChannelValue(
  channel: ChannelConfig,
  field: 'type' | 'enabled',
  nextValue: string | boolean
): ChannelConfig {
  if (field === 'type') {
    return {
      ...channel,
      type: typeof nextValue === 'string' ? nextValue : channel.type,
    }
  }

  return {
    ...channel,
    enabled: nextValue === true,
  }
}

function updateMcpServerValue(
  server: MCPServerConfig,
  field: 'transport' | 'enabled' | 'command' | 'url' | 'args' | 'env' | 'headers',
  nextValue: string | boolean | string[] | Record<string, string> | undefined
): MCPServerConfig {
  switch (field) {
    case 'transport':
      return {
        ...server,
        transport:
          nextValue === 'http' || nextValue === 'sse' || nextValue === 'stdio'
            ? nextValue
            : server.transport,
      }
    case 'enabled':
      return {
        ...server,
        enabled: nextValue === true,
      }
    case 'command':
      return {
        ...server,
        command: typeof nextValue === 'string' ? nextValue : undefined,
      }
    case 'url':
      return {
        ...server,
        url: typeof nextValue === 'string' ? nextValue : undefined,
      }
    case 'args':
      return {
        ...server,
        args: Array.isArray(nextValue) ? nextValue : undefined,
      }
    case 'env':
      return {
        ...server,
        env: nextValue && !Array.isArray(nextValue) && typeof nextValue === 'object' ? nextValue : undefined,
      }
    case 'headers':
      return {
        ...server,
        headers:
          nextValue && !Array.isArray(nextValue) && typeof nextValue === 'object' ? nextValue : undefined,
      }
  }
}

function updateAgentValue(
  agent: AgentConfig,
  field: 'id' | 'name' | 'workspace' | 'agentDir',
  nextValue: string
): AgentConfig {
  return {
    ...agent,
    [field]: nextValue || undefined,
  }
}

function SectionFrame({
  title,
  icon: Icon,
  description,
  children,
}: {
  title: string
  icon: ComponentType<{ className?: string }>
  description: string
  children: ReactNode
}) {
  return (
    <section className="border border-border/70 bg-card/70">
      <div className="border-b border-border/70 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className="h-4 w-4 text-amber-500" />
          <span>{title}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4 px-4 py-4">{children}</div>
    </section>
  )
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</Label>
        {hint ? <p className="mt-1 text-[11px] text-muted-foreground/70">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}

export function StructuredConfigEditor({ value, onChange }: StructuredConfigEditorProps) {
  const models = asObject<NonNullable<OpenClawConfig['models']>>(value.models)
  const logging = asObject<NonNullable<OpenClawConfig['logging']>>(value.logging)
  const diagnostics = asObject<NonNullable<OpenClawConfig['diagnostics']>>(value.diagnostics)
  const agents = asObject<AgentsConfig>(value.agents)

  const hasPrimary = hasOwn(models, 'primary')
  const hasFallback = hasOwn(models, 'fallback')
  const hasProviders = hasOwn(models, 'providers')
  const hasLoggingLevel = hasOwn(logging, 'level')
  const hasDiagnosticsEnabled = hasOwn(diagnostics, 'enabled')
  const hasBasicSection = hasPrimary || hasFallback || hasLoggingLevel || hasDiagnosticsEnabled

  const providerEntries = Object.entries(asRecord<ProviderConfig>(models.providers)).map(([key, provider]) => ({
    key,
    raw: asObject<ProviderConfig>(provider),
    value: normalizeProvider(provider),
  }))

  const hasChannelsSection = Array.isArray(value.channels)
  const channelEntries = asChannels(value.channels).map((channel, index) => ({
    index,
    raw: asObject<ChannelConfig>(channel),
    value: normalizeChannel(channel),
  }))

  const hasMcpSection = hasOwn(value, 'mcpServers') && typeof value.mcpServers === 'object' && !Array.isArray(value.mcpServers)
  const mcpEntries = Object.entries(asRecord<MCPServerConfig>(value.mcpServers)).map(([key, server]) => ({
    key,
    raw: asObject<MCPServerConfig>(server),
    value: normalizeMcpServer(server),
  }))

  const hasAgentsSection = hasOwn(agents, 'list') && Array.isArray(agents.list)
  const agentEntries = asAgents(agents.list).map((agent, index) => ({
    index,
    raw: asObject<AgentConfig>(agent),
    value: normalizeAgent(agent),
  }))

  const hasAnySection = hasBasicSection || hasProviders || hasChannelsSection || hasMcpSection || hasAgentsSection

  const updateConfig = (updater: (current: OpenClawConfig) => OpenClawConfig) => {
    onChange(updater(value))
  }

  const setPrimary = (primary: string) => {
    updateConfig((current) => {
      const currentModels = asObject<NonNullable<OpenClawConfig['models']>>(current.models)
      if (!hasOwn(currentModels, 'primary')) return current

      return {
        ...current,
        models: {
          ...currentModels,
          primary: primary.trim() || undefined,
        },
      }
    })
  }

  const setFallback = (fallback: string) => {
    updateConfig((current) => {
      const currentModels = asObject<NonNullable<OpenClawConfig['models']>>(current.models)
      if (!hasOwn(currentModels, 'fallback')) return current

      return {
        ...current,
        models: {
          ...currentModels,
          fallback: parseLines(fallback),
        },
      }
    })
  }

  const setLoggingLevel = (level: string) => {
    updateConfig((current) => {
      const currentLogging = asObject<NonNullable<OpenClawConfig['logging']>>(current.logging)
      if (!hasOwn(currentLogging, 'level')) return current

      return {
        ...current,
        logging: {
          ...currentLogging,
          level: level === '__unset__' ? undefined : (level as 'debug' | 'info' | 'warn' | 'error'),
        },
      }
    })
  }

  const setDiagnosticsEnabled = (enabled: boolean) => {
    updateConfig((current) => {
      const currentDiagnostics = asObject<NonNullable<OpenClawConfig['diagnostics']>>(current.diagnostics)
      if (!hasOwn(currentDiagnostics, 'enabled')) return current

      return {
        ...current,
        diagnostics: {
          ...currentDiagnostics,
          enabled,
        },
      }
    })
  }

  const updateProviderField = (
    key: string,
    field: 'apiKey' | 'apiType' | 'baseUrl' | 'models',
    nextValue: string | string[] | undefined
  ) => {
    updateConfig((current) => {
      const currentModels = asObject<NonNullable<OpenClawConfig['models']>>(current.models)
      const currentProviders = asRecord<ProviderConfig>(currentModels.providers)
      const currentProvider = asObject<ProviderConfig>(currentProviders[key])
      if (!hasOwn(currentProviders, key) || !hasOwn(currentProvider, field)) return current

      return {
        ...current,
        models: {
          ...currentModels,
          providers: {
            ...currentProviders,
            [key]: updateProviderValue(normalizeProvider(currentProviders[key]), field, nextValue),
          },
        },
      }
    })
  }

  const updateChannelField = (index: number, field: 'type' | 'enabled', nextValue: string | boolean) => {
    updateConfig((current) => {
      const currentChannels = asChannels(current.channels)
      const currentChannel = asObject<ChannelConfig>(currentChannels[index])
      if (!currentChannels[index] || !hasOwn(currentChannel, field)) return current

      return {
        ...current,
        channels: currentChannels.map((channel, itemIndex) =>
          itemIndex === index ? updateChannelValue(normalizeChannel(channel), field, nextValue) : channel
        ),
      }
    })
  }

  const updateMcpField = (
    key: string,
    field: 'transport' | 'enabled' | 'command' | 'url' | 'args' | 'env' | 'headers',
    nextValue: string | boolean | string[] | Record<string, string> | undefined
  ) => {
    updateConfig((current) => {
      const currentServers = asRecord<MCPServerConfig>(current.mcpServers)
      const currentServer = asObject<MCPServerConfig>(currentServers[key])
      if (!hasOwn(currentServers, key) || !hasOwn(currentServer, field)) return current

      return {
        ...current,
        mcpServers: {
          ...currentServers,
          [key]: updateMcpServerValue(normalizeMcpServer(currentServers[key]), field, nextValue),
        },
      }
    })
  }

  const updateAgentField = (index: number, field: 'id' | 'name' | 'workspace' | 'agentDir', nextValue: string) => {
    updateConfig((current) => {
      const currentAgents = asObject<AgentsConfig>(current.agents)
      const currentList = asAgents(currentAgents.list)
      const currentAgent = asObject<AgentConfig>(currentList[index])
      if (!currentList[index] || !hasOwn(currentAgent, field)) return current

      return {
        ...current,
        agents: {
          ...currentAgents,
          list: currentList.map((agent, itemIndex) =>
            itemIndex === index ? updateAgentValue(normalizeAgent(agent), field, nextValue) : agent
          ),
        },
      }
    })
  }

  if (!hasAnySection) {
    return (
      <div className="h-full overflow-auto bg-zinc-950/10 px-6 py-4">
        <Alert className="border-amber-500/20 bg-amber-500/5 text-foreground">
          <AlertDescription>
            当前 openclaw.json 中没有可结构化编辑的已知字段。请切换到 JSON 视图继续编辑。
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-zinc-950/10 px-6 py-4">
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {hasBasicSection ? (
            <SectionFrame
              title="基础运行项"
              icon={Settings2}
              description="仅展示当前 JSON 中已存在的基础字段；可修改，不新增。"
            >
              <div className="grid gap-4 md:grid-cols-2">
                {hasPrimary ? (
                  <FieldBlock label="主模型" hint="models.primary">
                    <Input
                      value={typeof models.primary === 'string' ? models.primary : ''}
                      onChange={(event) => setPrimary(event.target.value)}
                      placeholder="例如 claude-opus-4-6"
                    />
                  </FieldBlock>
                ) : null}

                {hasLoggingLevel ? (
                  <FieldBlock label="日志级别" hint="logging.level">
                    <Select
                      value={typeof logging.level === 'string' ? logging.level : '__unset__'}
                      onValueChange={setLoggingLevel}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="选择日志级别" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__unset__">未设置</SelectItem>
                        <SelectItem value="info">info</SelectItem>
                        <SelectItem value="debug">debug</SelectItem>
                        <SelectItem value="warn">warn</SelectItem>
                        <SelectItem value="error">error</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldBlock>
                ) : null}
              </div>

              {hasFallback ? (
                <FieldBlock label="降级模型" hint="models.fallback，每行一个模型 ID">
                  <textarea
                    className={textareaClassName}
                    value={formatLines(asStringArray(models.fallback))}
                    onChange={(event) => setFallback(event.target.value)}
                    placeholder={'claude-sonnet-4-6\nclaude-haiku-4-5'}
                  />
                </FieldBlock>
              ) : null}

              {hasDiagnosticsEnabled ? (
                <label className="flex items-center justify-between rounded-md border border-border/70 bg-background/80 px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">诊断开关</p>
                    <p className="text-xs text-muted-foreground">diagnostics.enabled</p>
                  </div>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-emerald-600"
                    checked={diagnostics.enabled === true}
                    onChange={(event) => setDiagnosticsEnabled(event.target.checked)}
                  />
                </label>
              ) : null}
            </SectionFrame>
          ) : null}

          {hasProviders ? (
            <SectionFrame
              title="Providers"
              icon={Database}
              description="仅展示当前 JSON 中已有的 provider 与其已有字段。"
            >
              <div className="space-y-3">
                {providerEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">当前 providers 为空。</p>
                ) : (
                  providerEntries.map(({ key, raw, value: provider }) => (
                    <div key={key} className="space-y-3 border border-border/70 bg-background/80 p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{key}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Provider Key
                        </p>
                      </div>

                      {(hasOwn(raw, 'apiKey') || hasOwn(raw, 'apiType')) ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {hasOwn(raw, 'apiKey') ? (
                            <FieldBlock label="API Key">
                              <Input
                                value={provider.apiKey ?? ''}
                                onChange={(event) => updateProviderField(key, 'apiKey', event.target.value)}
                              />
                            </FieldBlock>
                          ) : null}

                          {hasOwn(raw, 'apiType') ? (
                            <FieldBlock label="API Type">
                              <Input
                                value={provider.apiType ?? ''}
                                onChange={(event) => updateProviderField(key, 'apiType', event.target.value || undefined)}
                              />
                            </FieldBlock>
                          ) : null}
                        </div>
                      ) : null}

                      {hasOwn(raw, 'baseUrl') ? (
                        <FieldBlock label="Base URL">
                          <Input
                            value={provider.baseUrl ?? ''}
                            onChange={(event) => updateProviderField(key, 'baseUrl', event.target.value || undefined)}
                          />
                        </FieldBlock>
                      ) : null}

                      {hasOwn(raw, 'models') ? (
                        <FieldBlock label="Models" hint="每行一个模型 ID">
                          <textarea
                            className={textareaClassName}
                            value={formatLines(provider.models)}
                            onChange={(event) => updateProviderField(key, 'models', parseLines(event.target.value))}
                          />
                        </FieldBlock>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </SectionFrame>
          ) : null}

          {hasAgentsSection ? (
            <SectionFrame
              title="Agents"
              icon={Bot}
              description="解析当前 JSON 中已有的 agents.list，仅支持修改已有字段。"
            >
              <div className="space-y-3">
                {agentEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">当前 agents.list 为空。</p>
                ) : (
                  agentEntries.map(({ index, raw, value: agent }) => (
                    <div key={`${agent.id ?? agent.name ?? 'agent'}-${index}`} className="space-y-3 border border-border/70 bg-background/80 p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Agent #{index + 1}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          List Item
                        </p>
                      </div>

                      {(hasOwn(raw, 'id') || hasOwn(raw, 'name')) ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {hasOwn(raw, 'id') ? (
                            <FieldBlock label="ID" hint="agents.list[].id">
                              <Input
                                value={agent.id ?? ''}
                                onChange={(event) => updateAgentField(index, 'id', event.target.value)}
                              />
                            </FieldBlock>
                          ) : null}

                          {hasOwn(raw, 'name') ? (
                            <FieldBlock label="名称" hint="agents.list[].name">
                              <Input
                                value={agent.name ?? ''}
                                onChange={(event) => updateAgentField(index, 'name', event.target.value)}
                              />
                            </FieldBlock>
                          ) : null}
                        </div>
                      ) : null}

                      {(hasOwn(raw, 'workspace') || hasOwn(raw, 'agentDir')) ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {hasOwn(raw, 'workspace') ? (
                            <FieldBlock label="Workspace" hint="agents.list[].workspace">
                              <Input
                                value={agent.workspace ?? ''}
                                onChange={(event) => updateAgentField(index, 'workspace', event.target.value)}
                              />
                            </FieldBlock>
                          ) : null}

                          {hasOwn(raw, 'agentDir') ? (
                            <FieldBlock label="Agent Dir" hint="agents.list[].agentDir">
                              <Input
                                value={agent.agentDir ?? ''}
                                onChange={(event) => updateAgentField(index, 'agentDir', event.target.value)}
                              />
                            </FieldBlock>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </SectionFrame>
          ) : null}
        </div>

        <div className="space-y-4">
          {hasChannelsSection ? (
            <SectionFrame
              title="Channels"
              icon={Braces}
              description="仅展示当前 JSON 中已有的 channel 条目和已有字段。"
            >
              <div className="space-y-3">
                {channelEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">当前 channels 为空。</p>
                ) : (
                  channelEntries.map(({ index, raw, value: channel }) => (
                    <div key={`${channel.type}-${index}`} className="space-y-3 border border-border/70 bg-background/80 p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Channel #{index + 1}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Array Item
                        </p>
                      </div>

                      {(hasOwn(raw, 'type') || hasOwn(raw, 'enabled')) ? (
                        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                          {hasOwn(raw, 'type') ? (
                            <FieldBlock label="Type">
                              <Input
                                value={channel.type ?? ''}
                                onChange={(event) => updateChannelField(index, 'type', event.target.value)}
                              />
                            </FieldBlock>
                          ) : null}

                          {hasOwn(raw, 'enabled') ? (
                            <label className="flex items-end gap-2 pb-2 text-sm text-foreground">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-emerald-600"
                                checked={channel.enabled === true}
                                onChange={(event) => updateChannelField(index, 'enabled', event.target.checked)}
                              />
                              <span>启用</span>
                            </label>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </SectionFrame>
          ) : null}

          {hasMcpSection ? (
            <SectionFrame
              title="MCP Servers"
              icon={Cable}
              description="仅展示当前 JSON 中已有的 server 与其已有字段。"
            >
              <div className="space-y-3">
                {mcpEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">当前 mcpServers 为空。</p>
                ) : (
                  mcpEntries.map(({ key, raw, value: server }) => (
                    <div key={key} className="space-y-3 border border-border/70 bg-background/80 p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{key}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          Server Key
                        </p>
                      </div>

                      {(hasOwn(raw, 'transport') || hasOwn(raw, 'enabled')) ? (
                        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                          {hasOwn(raw, 'transport') ? (
                            <FieldBlock label="Transport">
                              <Select
                                value={server.transport}
                                onValueChange={(transport) =>
                                  updateMcpField(key, 'transport', transport as MCPServerConfig['transport'])
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="stdio">stdio</SelectItem>
                                  <SelectItem value="http">http</SelectItem>
                                  <SelectItem value="sse">sse</SelectItem>
                                </SelectContent>
                              </Select>
                            </FieldBlock>
                          ) : null}

                          {hasOwn(raw, 'enabled') ? (
                            <label className="flex items-end gap-2 pb-2 text-sm text-foreground">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-emerald-600"
                                checked={server.enabled === true}
                                onChange={(event) => updateMcpField(key, 'enabled', event.target.checked)}
                              />
                              <span>启用</span>
                            </label>
                          ) : null}
                        </div>
                      ) : null}

                      {(hasOwn(raw, 'command') || hasOwn(raw, 'url')) ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {hasOwn(raw, 'command') ? (
                            <FieldBlock label="Command">
                              <Input
                                value={server.command ?? ''}
                                onChange={(event) => updateMcpField(key, 'command', event.target.value || undefined)}
                              />
                            </FieldBlock>
                          ) : null}

                          {hasOwn(raw, 'url') ? (
                            <FieldBlock label="URL">
                              <Input
                                value={server.url ?? ''}
                                onChange={(event) => updateMcpField(key, 'url', event.target.value || undefined)}
                              />
                            </FieldBlock>
                          ) : null}
                        </div>
                      ) : null}

                      {hasOwn(raw, 'args') ? (
                        <FieldBlock label="Args" hint="每行一个参数">
                          <textarea
                            className={textareaClassName}
                            value={formatLines(server.args)}
                            onChange={(event) => updateMcpField(key, 'args', parseLines(event.target.value))}
                          />
                        </FieldBlock>
                      ) : null}

                      {(hasOwn(raw, 'env') || hasOwn(raw, 'headers')) ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {hasOwn(raw, 'env') ? (
                            <FieldBlock label="Env" hint="每行一对 KEY=VALUE">
                              <textarea
                                className={textareaClassName}
                                value={formatEntries(server.env)}
                                onChange={(event) => updateMcpField(key, 'env', parseEntries(event.target.value))}
                              />
                            </FieldBlock>
                          ) : null}

                          {hasOwn(raw, 'headers') ? (
                            <FieldBlock label="Headers" hint="每行一对 KEY=VALUE">
                              <textarea
                                className={textareaClassName}
                                value={formatEntries(server.headers)}
                                onChange={(event) => updateMcpField(key, 'headers', parseEntries(event.target.value))}
                              />
                            </FieldBlock>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </SectionFrame>
          ) : null}
        </div>
      </div>

      <Alert className="mt-4 border-amber-500/20 bg-amber-500/5 text-foreground">
        <AlertDescription>
          结构化视图只展示当前 openclaw.json 中已经存在的已知字段，并仅支持修改这些已有内容；如需新增结构或调整未知字段，请切回 JSON 视图。
        </AlertDescription>
      </Alert>
    </div>
  )
}
