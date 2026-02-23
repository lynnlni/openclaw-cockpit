'use client'

import { RemoteFileEditor } from '@/components/shared/remote-file-editor'

export default function BootstrapPage() {
  return (
    <RemoteFileEditor
      title="启动引导"
      description="编辑 BOOTSTRAP.md — 启动引导流程"
      filePath="workspace/BOOTSTRAP.md"
    />
  )
}
