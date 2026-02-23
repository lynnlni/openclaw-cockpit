'use client'

import { RemoteFileEditor } from '@/components/shared/remote-file-editor'

export default function UserPage() {
  return (
    <RemoteFileEditor
      title="用户档案"
      description="编辑 USER.md — 用户信息档案"
      filePath="workspace/USER.md"
    />
  )
}
