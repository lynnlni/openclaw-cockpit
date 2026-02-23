'use client'

import { RemoteFileEditor } from '@/components/shared/remote-file-editor'

export default function HeartbeatPage() {
  return (
    <RemoteFileEditor
      title="心跳配置"
      description="编辑 HEARTBEAT.md — 心跳与定时任务配置"
      filePath="workspace/HEARTBEAT.md"
    />
  )
}
