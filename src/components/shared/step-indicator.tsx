import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface Step {
  label: string
  description?: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isPending = index > currentStep

        return (
          <div key={step.label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium',
                  isCompleted && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && 'border-primary text-primary',
                  isPending && 'border-muted-foreground/30 text-muted-foreground/50',
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    'text-sm font-medium',
                    isPending && 'text-muted-foreground/50',
                    isCurrent && 'text-foreground',
                    isCompleted && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-xs text-muted-foreground">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-px w-8 shrink-0',
                  index < currentStep ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
