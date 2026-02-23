import { join } from 'path'
import type { WorkspaceStructure } from './types'

type FileCategory = 'config' | 'skill' | 'memory' | 'knowledge' | 'other'

export function getWorkspacePaths(openclawPath: string): WorkspaceStructure {
  return {
    path: openclawPath,
    configPath: join(openclawPath, 'openclaw.json'),
    skillsDir: join(openclawPath, 'workspace', 'skills'),
    memoryDir: join(openclawPath, 'workspace', 'memory'),
    knowledgeDir: join(openclawPath, 'workspace', 'knowledge'),
  }
}

export function isWorkspaceFile(
  filePath: string,
  workspace: WorkspaceStructure
): FileCategory {
  if (filePath === workspace.configPath) {
    return 'config'
  }

  if (filePath.startsWith(workspace.skillsDir)) {
    return 'skill'
  }

  if (filePath.startsWith(workspace.memoryDir)) {
    return 'memory'
  }

  if (filePath.startsWith(workspace.knowledgeDir)) {
    return 'knowledge'
  }

  return 'other'
}
