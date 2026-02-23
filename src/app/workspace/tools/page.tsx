'use client'

import { RemoteFileEditor } from '@/components/shared/remote-file-editor'

export default function ToolsPage() {
  return (
    <RemoteFileEditor
      title="工具配置"
      description="编辑 TOOLS.md — 工具使用规则"
      filePath="workspace/TOOLS.md"
    />
  )
}
