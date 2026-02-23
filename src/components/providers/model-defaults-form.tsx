'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { GripVertical, X } from 'lucide-react'

interface ModelDefaultsFormProps {
  primary: string
  fallback: string[]
  onSave: (primary: string, fallback: string[]) => void
  saving?: boolean
}

const inputClass =
  'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

export function ModelDefaultsForm({ primary, fallback, onSave, saving }: ModelDefaultsFormProps) {
  const [primaryModel, setPrimaryModel] = useState(primary)
  const [fallbackModels, setFallbackModels] = useState<string[]>(fallback)
  const [newModel, setNewModel] = useState('')

  const handleAddFallback = useCallback(() => {
    if (newModel.trim() && !fallbackModels.includes(newModel.trim())) {
      setFallbackModels((prev) => [...prev, newModel.trim()])
      setNewModel('')
    }
  }, [newModel, fallbackModels])

  const handleRemoveFallback = useCallback((index: number) => {
    setFallbackModels((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSave = useCallback(() => {
    onSave(primaryModel, fallbackModels)
  }, [primaryModel, fallbackModels, onSave])

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <h4 className="text-sm font-medium text-foreground">默认模型配置</h4>

      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">主模型</label>
        <input
          className={inputClass}
          value={primaryModel}
          onChange={(e) => setPrimaryModel(e.target.value)}
          placeholder="gpt-4o"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm text-muted-foreground">回退模型链</label>
        <div className="space-y-1">
          {fallbackModels.map((model, i) => (
            <div key={`${model}-${i}`} className="flex items-center gap-1">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="flex-1 rounded-md bg-muted px-2 py-1.5 text-sm font-mono text-foreground">
                {model}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleRemoveFallback(i)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            className={inputClass}
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddFallback()
              }
            }}
            placeholder="添加回退模型..."
          />
          <Button variant="outline" size="sm" onClick={handleAddFallback}>
            添加
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}
