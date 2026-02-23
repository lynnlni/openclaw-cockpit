'use client'

import type { FileEntry } from '@/lib/ssh/types'
import { FileTreeItem } from '@/components/memory/file-tree-item'

interface FileTreeProps {
  files: FileEntry[]
  selectedPath: string | undefined
  onSelect: (path: string) => void
}

export function FileTree({ files, selectedPath, onSelect }: FileTreeProps) {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        暂无文件
      </div>
    )
  }

  return (
    <div className="space-y-0.5 py-1">
      {files.map((entry) => (
        <FileTreeItem
          key={entry.path}
          entry={entry}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
