'use client'

import { useState, useCallback, useEffect } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useMachine } from '@/store/machine-context'
import { useFileContent, useSaveFile } from '@/hooks/use-file-content'
import { MarkdownEditor } from '@/components/memory/markdown-editor'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { fetcher } from '@/hooks/fetcher'
import {
  Save,
  Undo2,
  Server,
  Calendar,
} from 'lucide-react'
import type { DailyMemory } from '@/lib/workspace/types'

export default function DailyMemoryPage() {
  const { selectedMachineId } = useMachine()

  const { data: memories, isLoading: memoriesLoading } = useSWR<DailyMemory[]>(
    selectedMachineId
      ? `/api/instances/${selectedMachineId}/memory/daily`
      : null,
    fetcher
  )

  const [selectedPath, setSelectedPath] = useState<string | undefined>()
  const { data: fileData, isLoading: contentLoading } = useFileContent(
    selectedMachineId ?? undefined,
    selectedPath
  )
  const { trigger: saveFile, isMutating: saving } = useSaveFile(
    selectedMachineId ?? undefined,
    selectedPath
  )

  const [editorContent, setEditorContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const modified = editorContent !== originalContent

  useEffect(() => {
    if (fileData?.content !== undefined) {
      setEditorContent(fileData.content)
      setOriginalContent(fileData.content)
    }
  }, [fileData?.content])

  const handleSave = useCallback(async () => {
    if (!modified) return
    try {
      await saveFile({ content: editorContent })
      setOriginalContent(editorContent)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败')
    }
  }, [modified, editorContent, saveFile])

  const handleDiscard = useCallback(() => {
    setEditorContent(originalContent)
  }, [originalContent])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  if (!selectedMachineId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Server className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">请先在侧边栏选择一台机器</p>
      </div>
    )
  }

  const sortedMemories = [...(memories ?? [])].sort((a, b) =>
    b.date.localeCompare(a.date)
  )

  const selectedFileName = selectedPath?.split('/').pop()

  return (
    <div className="-m-6 flex flex-col" style={{ height: 'calc(100% + 48px)' }}>
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">每日记忆</h1>
          <p className="text-sm text-muted-foreground">
            浏览和编辑每日记忆文件 (workspace/memory/)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400">已保存</span>
          )}
          {modified && (
            <span className="text-xs text-amber-400">未保存</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDiscard}
            disabled={!modified || saving}
          >
            <Undo2 className="mr-1 h-3.5 w-3.5" />
            丢弃
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!modified || saving}
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden border-b border-border">
        {/* Date list sidebar */}
        <div className="w-48 shrink-0 overflow-y-auto border-r border-border">
          {memoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner text="加载记忆列表..." />
            </div>
          ) : sortedMemories.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 opacity-30" />
              <p className="text-xs">暂无每日记忆文件</p>
            </div>
          ) : (
            <div className="py-0.5">
              {sortedMemories.map((memory) => {
                const isSelected = selectedPath === memory.path
                const dateObj = new Date(memory.date + 'T00:00:00')
                const valid = !isNaN(dateObj.getTime())
                const day = valid ? String(dateObj.getDate()).padStart(2, '0') : ''
                const monthLabel = valid ? `${dateObj.getMonth() + 1}月` : ''
                const weekday = valid
                  ? dateObj.toLocaleDateString('zh-CN', { weekday: 'short' })
                  : ''
                return (
                  <button
                    key={memory.path}
                    type="button"
                    onClick={() => setSelectedPath(memory.path)}
                    className={`flex w-full items-center gap-2 px-2 py-1 text-left transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded border ${
                      isSelected
                        ? 'border-primary/30 bg-primary/10'
                        : 'border-border bg-muted/40'
                    }`}>
                      <span className="text-[9px] leading-none opacity-60">{monthLabel}</span>
                      <span className="text-sm font-bold leading-tight">{day}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs">{memory.date}</span>
                      <span className="block text-[10px] opacity-50">{weekday}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Editor area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {selectedPath ? (
            contentLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <LoadingSpinner text="加载文件内容..." />
              </div>
            ) : (
              <>
                <div className="border-b border-border px-4 py-1.5 text-xs text-muted-foreground">
                  {selectedFileName}
                </div>
                <MarkdownEditor
                  value={editorContent}
                  onChange={setEditorContent}
                  className="flex-1"
                />
              </>
            )
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <Calendar className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">选择一个日期查看记忆</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
