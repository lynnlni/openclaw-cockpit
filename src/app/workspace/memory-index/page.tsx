'use client'

import { RemoteFileEditor } from '@/components/shared/remote-file-editor'

export default function MemoryIndexPage() {
  return (
    <RemoteFileEditor
      title="记忆索引"
      description="编辑 MEMORY.md — 记忆索引与结构"
      filePath="workspace/MEMORY.md"
    />
  )
}
