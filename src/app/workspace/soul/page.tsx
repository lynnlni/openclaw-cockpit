'use client'

import { RemoteFileEditor } from '@/components/shared/remote-file-editor'

export default function SoulPage() {
  return (
    <RemoteFileEditor
      title="性格设定"
      description="编辑 SOUL.md — 定义 AI 性格特征"
      filePath="workspace/SOUL.md"
    />
  )
}
