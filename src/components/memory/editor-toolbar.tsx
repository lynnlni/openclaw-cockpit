import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Save, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  fileName: string | undefined
  modified: boolean
  saving: boolean
  onSave: () => void
  onDiscard: () => void
}

export function EditorToolbar({
  fileName,
  modified,
  saving,
  onSave,
  onDiscard,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {fileName ?? '未选择文件'}
        </span>
        {modified && (
          <Badge variant="secondary" className={cn('text-xs')}>
            未保存
          </Badge>
        )}
      </div>

      {fileName && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDiscard}
            disabled={!modified || saving}
          >
            <Undo2 className="h-3.5 w-3.5" />
            放弃更改
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={!modified || saving}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      )}
    </div>
  )
}
