export type { MCPServerConfig } from '../config/types'

export interface MCPTestResult {
  success: boolean
  message: string
  responseTime?: number
}
