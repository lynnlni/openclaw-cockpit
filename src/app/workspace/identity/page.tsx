'use client'

import { RemoteFileEditor } from '@/components/shared/remote-file-editor'

export default function IdentityPage() {
  return (
    <RemoteFileEditor
      title="身份信息"
      description="编辑 IDENTITY.md — 定义 AI 身份"
      filePath="workspace/IDENTITY.md"
    />
  )
}
