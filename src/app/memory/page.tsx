'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMachine } from '@/store/machine-context'
import { useWorkspaceFiles } from '@/hooks/use-workspace-files'
import { useFileContent, useSaveFile } from '@/hooks/use-file-content'
import { FileTree } from '@/components/memory/file-tree'
import { MarkdownEditor } from '@/components/memory/markdown-editor'
import { EditorToolbar } from '@/components/memory/editor-toolbar'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Brain, Server } from 'lucide-react'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'

export default function MemoryPage() {
  const { selectedMachineId } = useMachine()
  const { data: files, isLoading: filesLoading } = useWorkspaceFiles(selectedMachineId ?? undefined)
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
  const modified = editorContent !== originalContent

  useEffect(() => {
    if (fileData?.content !== undefined) {
      setEditorContent(fileData.content)
      setOriginalContent(fileData.content)
    }
  }, [fileData?.content])

  const handleSave = useCallback(async () => {
    if (!modified) return
    await saveFile({ content: editorContent })
    setOriginalContent(editorContent)
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

  if (filesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner text="加载文件..." />
      </div>
    )
  }

  const fileName = selectedPath?.split('/').pop()

  return (
    <div className="flex h-full flex-col -m-6">
      <div className="border-b border-border px-6 py-3">
        <h1 className="text-lg font-semibold text-foreground">记忆管理</h1>
        <p className="text-sm text-muted-foreground">编辑工作区中的 Markdown 文件</p>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
          <div className="h-full overflow-y-auto border-r border-border bg-card px-2">
            <FileTree
              files={files ?? []}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={75}>
          <div className="flex h-full flex-col">
            <EditorToolbar
              fileName={fileName}
              modified={modified}
              saving={saving}
              onSave={handleSave}
              onDiscard={handleDiscard}
            />
            {selectedPath ? (
              contentLoading ? (
                <div className="flex flex-1 items-center justify-center">
                  <LoadingSpinner text="加载文件内容..." />
                </div>
              ) : (
                <MarkdownEditor
                  value={editorContent}
                  onChange={setEditorContent}
                  className="flex-1"
                />
              )
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3">
                <Brain className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">选择一个文件开始编辑</p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
