export interface OpenClawConfig {
  models?: ModelsConfig
  channels?: ChannelConfig[]
  mcpServers?: Record<string, MCPServerConfig>
  logging?: LoggingConfig
  diagnostics?: DiagnosticsConfig
  agents?: AgentsConfig
  [key: string]: unknown
}

export interface LoggingConfig {
  level?: 'debug' | 'info' | 'warn' | 'error'
}

export interface DiagnosticsConfig {
  enabled?: boolean
}

export interface AgentsConfig {
  list?: AgentConfig[]
  [key: string]: unknown
}

export interface AgentConfig {
  id?: string
  name?: string
  workspace?: string
  agentDir?: string
  [key: string]: unknown
}

export interface ModelsConfig {
  primary?: string
  fallback?: string[]
  providers?: Record<string, ProviderConfig>
}

export interface ProviderConfig {
  apiKey: string
  baseUrl?: string
  apiType?: string
  models?: string[]
}

export interface ChannelConfig {
  type: string
  enabled: boolean
  [key: string]: unknown
}

export interface MCPServerConfig {
  transport: 'stdio' | 'http' | 'sse'
  enabled?: boolean
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
}
