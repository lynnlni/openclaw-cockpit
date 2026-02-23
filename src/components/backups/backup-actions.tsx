import { Button } from '@/components/ui/button'
import { Download, Upload } from 'lucide-react'

interface BackupActionsProps {
  onExport: () => void
  onImport: () => void
  exporting?: boolean
}

export function BackupActions({ onExport, onImport, exporting }: BackupActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onExport} disabled={exporting}>
        <Download className="h-3.5 w-3.5" />
        {exporting ? '导出中...' : '导出'}
      </Button>
      <Button variant="outline" size="sm" onClick={onImport}>
        <Upload className="h-3.5 w-3.5" />
        导入
      </Button>
    </div>
  )
}
