'use client'

import { useState, useCallback } from 'react'
import { FrontmatterForm, type FrontmatterData } from '@/components/skills/frontmatter-form'
import { MarkdownEditor } from '@/components/memory/markdown-editor'
import { Button } from '@/components/ui/button'
import { Save, ArrowLeft } from 'lucide-react'

interface SkillEditorProps {
  skillName: string
  initialFrontmatter: FrontmatterData
  initialContent: string
  onSave: (frontmatter: FrontmatterData, content: string) => void
  onBack: () => void
  saving?: boolean
}

export function SkillEditor({
  skillName,
  initialFrontmatter,
  initialContent,
  onSave,
  onBack,
  saving,
}: SkillEditorProps) {
  const [frontmatter, setFrontmatter] = useState<FrontmatterData>(initialFrontmatter)
  const [content, setContent] = useState(initialContent)

  const handleSave = useCallback(() => {
    onSave(frontmatter, content)
  }, [frontmatter, content, onSave])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-xs" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-medium text-foreground">{skillName}</h3>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save className="h-3.5 w-3.5" />
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 shrink-0 overflow-y-auto border-r border-border p-4">
          <FrontmatterForm data={frontmatter} onChange={setFrontmatter} />
        </div>
        <div className="flex-1 overflow-hidden">
          <MarkdownEditor
            value={content}
            onChange={setContent}
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}
