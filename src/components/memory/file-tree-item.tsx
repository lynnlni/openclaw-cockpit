'use client'

import { useState, useCallback } from 'react'
import type { FileEntry } from '@/lib/ssh/types'
import { cn } from '@/lib/utils'
import { ChevronRight, File, Folder } from 'lucide-react'

interface FileTreeItemProps {
  entry: FileEntry
  depth: number
  selectedPath: string | undefined
  onSelect: (path: string) => void
}

export function FileTreeItem({ entry, depth, selectedPath, onSelect }: FileTreeItemProps) {
  const [expanded, setExpanded] = useState(false)
  const isDirectory = entry.type === 'directory'
  const isSelected = entry.path === selectedPath

  const handleClick = useCallback(() => {
    if (isDirectory) {
      setExpanded((prev) => !prev)
    } else {
      onSelect(entry.path)
    }
  }, [isDirectory, entry.path, onSelect])

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-sm px-2 py-1 text-left text-sm transition-colors hover:bg-muted/50',
          isSelected && 'bg-primary/10 text-primary',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDirectory ? (
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform',
              expanded && 'rotate-90',
            )}
          />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {isDirectory ? (
          <Folder className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{entry.name}</span>
      </button>

      {isDirectory && expanded && entry.children && (
        <div>
          {entry.children.map((child) => (
            <FileTreeItem
              key={child.path}
              entry={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
