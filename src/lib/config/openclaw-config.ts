import type {
  OpenClawConfig,
  ProviderConfig,
  ChannelConfig,
  MCPServerConfig,
} from './types'

export function parseConfig(jsonString: string): OpenClawConfig {
  try {
    return JSON.parse(jsonString) as OpenClawConfig
  } catch (error) {
    throw new Error(
      `Failed to parse openclaw.json: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export function serializeConfig(config: OpenClawConfig): string {
  return JSON.stringify(config, null, 2)
}

export function getProviders(
  config: OpenClawConfig
): Record<string, ProviderConfig> {
  return config.models?.providers ?? {}
}

export function setProviders(
  config: OpenClawConfig,
  providers: Record<string, ProviderConfig>
): OpenClawConfig {
  return {
    ...config,
    models: {
      ...config.models,
      providers,
    },
  }
}

export function getChannels(config: OpenClawConfig): ChannelConfig[] {
  return config.channels ?? []
}

export function setChannels(
  config: OpenClawConfig,
  channels: ChannelConfig[]
): OpenClawConfig {
  return {
    ...config,
    channels,
  }
}

export function getMcpServers(
  config: OpenClawConfig
): Record<string, MCPServerConfig> {
  return config.mcpServers ?? {}
}

export function setMcpServers(
  config: OpenClawConfig,
  servers: Record<string, MCPServerConfig>
): OpenClawConfig {
  return {
    ...config,
    mcpServers: servers,
  }
}
