import { parseConfig, serializeConfig, getMcpServers, setMcpServers } from '../config/openclaw-config'
import type { MCPServerConfig } from '../config/types'

export function getMcpServersFromJson(
  configJson: string
): Record<string, MCPServerConfig> {
  const config = parseConfig(configJson)
  return getMcpServers(config)
}

export function addMcpServer(
  configJson: string,
  name: string,
  server: MCPServerConfig
): string {
  const config = parseConfig(configJson)
  const servers = getMcpServers(config)

  if (servers[name]) {
    throw new Error(`MCP server "${name}" already exists`)
  }

  const updated = setMcpServers(config, { ...servers, [name]: server })
  return serializeConfig(updated)
}

export function updateMcpServer(
  configJson: string,
  name: string,
  server: MCPServerConfig
): string {
  const config = parseConfig(configJson)
  const servers = getMcpServers(config)

  if (!servers[name]) {
    throw new Error(`MCP server "${name}" not found`)
  }

  const updated = setMcpServers(config, { ...servers, [name]: server })
  return serializeConfig(updated)
}

export function removeMcpServer(
  configJson: string,
  name: string
): string {
  const config = parseConfig(configJson)
  const servers = getMcpServers(config)

  const { [name]: _removed, ...remaining } = servers
  if (!_removed) {
    throw new Error(`MCP server "${name}" not found`)
  }

  const updated = setMcpServers(config, remaining)
  return serializeConfig(updated)
}

export function toggleMcpServer(
  configJson: string,
  name: string,
  enabled: boolean
): string {
  const config = parseConfig(configJson)
  const servers = getMcpServers(config)
  const existing = servers[name]

  if (!existing) {
    throw new Error(`MCP server "${name}" not found`)
  }

  const updated = setMcpServers(config, {
    ...servers,
    [name]: { ...existing, enabled },
  })
  return serializeConfig(updated)
}
