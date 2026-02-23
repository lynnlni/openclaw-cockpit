'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMachine } from '@/store/machine-context'
import { useFileContent, useSaveFile } from '@/hooks/use-file-content'
import { MarkdownEditor } from '@/components/memory/markdown-editor'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Save, Undo2, Server, AlertCircle } from 'lucide-react'

interface RemoteFileEditorProps {
  title: string
  description: string
  filePath: string
  icon?: React.ReactNode
}

export function RemoteFileEditor({
  title,
  description,
  filePath,
  icon,
}: RemoteFileEditorProps) {
  const { selectedMachineId } = useMachine()
  const { data: fileData, error: loadError, isLoading } = useFileContent(
    selectedMachineId ?? undefined,
    filePath
  )
  const { trigger: saveFile, isMutating: saving } = useSaveFile(
    selectedMachineId ?? undefined,
    filePath
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
    } catch {
      // error handled by useSaveFile
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

  return (
    <div className="-m-6 flex flex-col" style={{ height: 'calc(100% + 48px)' }}>
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
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

      <div className="flex-1 overflow-hidden border-b border-border px-6 py-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner text="加载文件..." />
          </div>
        ) : loadError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              文件不存在或无法读取
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {filePath}
            </p>
          </div>
        ) : (
          <MarkdownEditor
            value={editorContent}
            onChange={setEditorContent}
            className="h-full"
          />
        )}
      </div>
    </div>
  )
}
