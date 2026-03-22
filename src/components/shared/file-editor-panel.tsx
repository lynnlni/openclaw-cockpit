'use client'

import { useState, useCallback, useEffect } from 'react'
import { Save, Undo2, AlertCircle } from 'lucide-react'

import { useFileContent, useSaveFile } from '@/hooks/use-file-content'
import { MarkdownEditor } from '@/components/memory/markdown-editor'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { formatFileSize, formatModifiedAt } from '@/lib/utils'

export function FileEditorPanel({
  machineId,
  filePath,
}: {
  machineId: string
  filePath: string
}) {
  const { data: fileData, error: loadError, isLoading } = useFileContent(machineId, filePath)
  const { trigger: saveFile, isMutating: saving } = useSaveFile(machineId, filePath)
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
    } catch {
      // handled by useSaveFile
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-border px-4 py-2 shrink-0">
        <div>
          <p className="text-sm font-medium font-mono text-foreground">{filePath}</p>
          {(fileData?.size !== undefined || fileData?.modifiedAt) && (
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {fileData.size !== undefined && formatFileSize(fileData.size)}
              {fileData.size !== undefined && fileData.modifiedAt && ' · '}
              {fileData.modifiedAt && `修改于 ${formatModifiedAt(fileData.modifiedAt)}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && <span className="text-xs text-emerald-400">已保存</span>}
          {modified && <span className="text-xs text-amber-400">未保存</span>}
          <Button variant="outline" size="sm" onClick={handleDiscard} disabled={!modified || saving}>
            <Undo2 className="mr-1 h-3.5 w-3.5" />
            丢弃
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!modified || saving}>
            <Save className="mr-1 h-3.5 w-3.5" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-4 py-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner text="加载文件..." />
          </div>
        ) : loadError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">文件不存在或无法读取</p>
            <p className="text-xs font-mono text-muted-foreground/60">{filePath}</p>
          </div>
        ) : (
          <MarkdownEditor value={editorContent} onChange={setEditorContent} className="h-full" />
        )}
      </div>
    </div>
  )
}
