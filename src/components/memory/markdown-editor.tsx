'use client'

import { useCallback } from 'react'
import { useTheme } from 'next-themes'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const extensions = [markdown()]

export function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme()
  const handleChange = useCallback(
    (val: string) => {
      onChange(val)
    },
    [onChange]
  )

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <div className="absolute inset-0">
        <CodeMirror
          value={value}
          onChange={handleChange}
          extensions={extensions}
          theme={resolvedTheme === 'dark' ? oneDark : undefined}
          height="100%"
          className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto"
        />
      </div>
    </div>
  )
}
