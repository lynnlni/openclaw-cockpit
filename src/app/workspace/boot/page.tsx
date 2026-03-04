'use client'

import { RemoteFileEditor } from '@/components/shared/remote-file-editor'

export default function BootPage() {
  return (
    <RemoteFileEditor
      title="网关启动"
      description="编辑 BOOT.md — 网关每次启动时执行的钩子任务"
      filePath="workspace/BOOT.md"
    />
  )
}
