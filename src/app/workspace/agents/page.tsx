'use client'

import { RemoteFileEditor } from '@/components/shared/remote-file-editor'

export default function AgentsPage() {
  return (
    <RemoteFileEditor
      title="Agent 配置"
      description="编辑 AGENTS.md — Agent 行为配置"
      filePath="workspace/AGENTS.md"
    />
  )
}
