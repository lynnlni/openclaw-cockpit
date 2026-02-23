'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'

interface FrontmatterFormProps {
  data: FrontmatterData
  onChange: (data: FrontmatterData) => void
}

export interface FrontmatterData {
  name: string
  description: string
  version: string
  tags: string[]
  enabled: boolean
}

const inputClass =
  'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export function FrontmatterForm({ data, onChange }: FrontmatterFormProps) {
  const [tagInput, setTagInput] = useState('')

  const handleChange = useCallback(
    (field: keyof FrontmatterData, value: string | boolean) => {
      onChange({ ...data, [field]: value })
    },
    [data, onChange]
  )

  const handleAddTag = useCallback(() => {
    const tag = tagInput.trim()
    if (tag && !data.tags.includes(tag)) {
      onChange({ ...data, tags: [...data.tags, tag] })
      setTagInput('')
    }
  }, [tagInput, data, onChange])

  const handleRemoveTag = useCallback(
    (tag: string) => {
      onChange({ ...data, tags: data.tags.filter((t) => t !== tag) })
    },
    [data, onChange]
  )

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">名称</label>
        <input
          className={inputClass}
          value={data.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">描述</label>
        <textarea
          className={`${inputClass} h-20 resize-none`}
          value={data.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">版本</label>
        <input
          className={inputClass}
          value={data.version}
          onChange={(e) => handleChange('version', e.target.value)}
          placeholder="1.0.0"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">标签</label>
        <div className="flex gap-2">
          <input
            className={inputClass}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
            placeholder="添加标签..."
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAddTag}>
            添加
          </Button>
        </div>
        {data.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {data.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
              >
                {tag} &times;
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground">启用</label>
        <button
          type="button"
          role="switch"
          aria-checked={data.enabled}
          onClick={() => handleChange('enabled', !data.enabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            data.enabled ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
              data.enabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
