import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  text?: string
  className?: string
}

export function LoadingSpinner({ text, className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  )
}
