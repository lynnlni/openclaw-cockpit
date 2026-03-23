'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTheme } from 'next-themes'
import CodeMirror from '@uiw/react-codemirror'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { AlertCircle, Braces, FileCode2, Save, Server, Undo2 } from 'lucide-react'

import { StructuredConfigEditor } from '@/components/config/structured-config-editor'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { useFileContent, useSaveFile } from '@/hooks/use-file-content'
import { parseConfig, serializeConfig } from '@/lib/config/openclaw-config'
import type { OpenClawConfig } from '@/lib/config/types'
import { cn, formatFileSize, formatModifiedAt } from '@/lib/utils'
import { useMachine } from '@/store/machine-context'

const extensions = [json()]

type EditorTab = 'json' | 'structured'

interface EditorState {
  rawJson: string
  originalContent: string
  parsedConfig: OpenClawConfig
  parseError: string | null
}

function buildEditorState(content: string): EditorState {
  try {
    return {
      rawJson: content,
      originalContent: content,
      parsedConfig: parseConfig(content),
      parseError: null,
    }
  } catch (error) {
    return {
      rawJson: content,
      originalContent: content,
      parsedConfig: {},
      parseError: error instanceof Error ? error.message : '配置解析失败',
    }
  }
}

function ConfigEditor({
  initialContent,
}: {
  initialContent: string
}) {
  const { resolvedTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<EditorTab>('json')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [editorState, setEditorState] = useState<EditorState>(() => buildEditorState(initialContent))
  const { selectedMachineId } = useMachine()
  const { trigger: saveFile, isMutating: saving } = useSaveFile(
    selectedMachineId ?? undefined,
    'openclaw.json'
  )

  const modified = editorState.rawJson !== editorState.originalContent

  const handleRawChange = useCallback((value: string) => {
    setEditorState((current) => {
      try {
        return {
          ...current,
          rawJson: value,
          parsedConfig: parseConfig(value),
          parseError: null,
        }
      } catch (error) {
        return {
          ...current,
          rawJson: value,
          parseError: error instanceof Error ? error.message : '配置解析失败',
        }
      }
    })
  }, [])

  const handleStructuredChange = useCallback((nextConfig: OpenClawConfig) => {
    setEditorState((current) => ({
      ...current,
      rawJson: serializeConfig(nextConfig),
      parsedConfig: nextConfig,
      parseError: null,
    }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!modified || editorState.parseError) return

    try {
      await saveFile({ content: editorState.rawJson })
      setEditorState((current) => ({
        ...current,
        originalContent: current.rawJson,
      }))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch {
      // error handled by useSaveFile
    }
  }, [editorState.parseError, editorState.rawJson, modified, saveFile])

  const handleDiscard = useCallback(() => {
    setEditorState(buildEditorState(editorState.originalContent))
  }, [editorState.originalContent])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault()
        void handleSave()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave])

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={cn(
              'inline-flex items-center gap-2 border px-3 py-2 text-sm transition-colors',
              activeTab === 'json'
                ? 'border-amber-500/30 bg-amber-500/10 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <FileCode2 className="h-4 w-4" />
            JSON 视图
          </button>
          <button
            type="button"
            onClick={() => {
              if (!editorState.parseError) setActiveTab('structured')
            }}
            disabled={Boolean(editorState.parseError)}
            className={cn(
              'inline-flex items-center gap-2 border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              activeTab === 'structured'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <Braces className="h-4 w-4" />
            结构化视图
          </button>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && <span className="text-xs text-emerald-400">已保存</span>}
          {modified && <span className="text-xs text-amber-400">未保存</span>}
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
            onClick={() => void handleSave()}
            disabled={!modified || saving || Boolean(editorState.parseError)}
          >
            <Save className="mr-1 h-3.5 w-3.5" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      <div className="border-b border-border px-6 py-3">
        <p className="text-xs text-muted-foreground/70">
          JSON 视图保留原始源码编辑；结构化视图适合快速维护常见字段，两个视图会同步到同一份配置。
        </p>
      </div>

      <div className="flex-1 overflow-hidden border-b border-border px-6 py-3">
        <div className="flex h-full flex-col gap-3 overflow-hidden">
          {editorState.parseError ? (
            <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>JSON 解析失败</AlertTitle>
              <AlertDescription>{editorState.parseError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="min-h-0 flex-1 overflow-hidden border border-border/70 bg-card/50">
            {activeTab === 'json' ? (
              <div className="relative h-full overflow-hidden">
                <div className="absolute inset-0">
                  <CodeMirror
                    value={editorState.rawJson}
                    onChange={handleRawChange}
                    extensions={extensions}
                    theme={resolvedTheme === 'dark' ? oneDark : undefined}
                    height="100%"
                    className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
                  />
                </div>
              </div>
            ) : (
              <StructuredConfigEditor
                value={editorState.parsedConfig}
                onChange={handleStructuredChange}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function ConfigPage() {
  const { selectedMachineId } = useMachine()
  const { data: fileData, error: loadError, isLoading } = useFileContent(
    selectedMachineId ?? undefined,
    'openclaw.json'
  )

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
        <div>
          <h1 className="text-lg font-semibold text-foreground">核心配置</h1>
          <p className="text-sm text-muted-foreground">
            编辑 openclaw.json — OpenClaw 核心配置文件
          </p>
          {(fileData?.size !== undefined || fileData?.modifiedAt) && (
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {fileData.size !== undefined && formatFileSize(fileData.size)}
              {fileData.size !== undefined && fileData.modifiedAt && ' · '}
              {fileData.modifiedAt && `修改于 ${formatModifiedAt(fileData.modifiedAt)}`}
            </p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center border-b border-border px-6 py-3">
          <LoadingSpinner text="加载文件..." />
        </div>
      ) : loadError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 border-b border-border px-6 py-3">
          <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">文件不存在或无法读取</p>
          <p className="text-xs font-mono text-muted-foreground">openclaw.json</p>
        </div>
      ) : (
        <ConfigEditor
          key={fileData?.modifiedAt ?? fileData?.content ?? 'openclaw.json'}
          initialContent={fileData?.content ?? ''}
        />
      )}
    </div>
  )
}
