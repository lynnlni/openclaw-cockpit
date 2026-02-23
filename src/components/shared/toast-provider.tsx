'use client'

import { useTheme } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'

export function ToastProvider() {
  const { resolvedTheme } = useTheme()

  return (
    <Toaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="top-right"
      richColors
      closeButton
    />
  )
}
