import type { VersionInfo } from '@/lib/deploy/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'

interface VersionInfoDisplayProps {
  versionInfo: VersionInfo
  onUpgrade: () => void
  upgrading?: boolean
}

export function VersionInfoDisplay({
  versionInfo,
  onUpgrade,
  upgrading,
}: VersionInfoDisplayProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">当前版本:</span>
          <span className="font-mono text-foreground">
            {versionInfo.current ?? '未安装'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">最新版本:</span>
          <span className="font-mono text-foreground">
            {versionInfo.latest ?? '未知'}
          </span>
          {versionInfo.updateAvailable && (
            <Badge variant="default" className="text-xs">
              可更新
            </Badge>
          )}
        </div>
      </div>

      {versionInfo.updateAvailable && (
        <Button onClick={onUpgrade} disabled={upgrading} size="sm">
          <ArrowUp className="h-3.5 w-3.5" />
          {upgrading ? '升级中...' : '升级'}
        </Button>
      )}
    </div>
  )
}
