'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Error reporting could be added here
    void errorInfo
    void error
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-8">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">
              出现错误
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {this.state.error?.message ?? '发生了未知错误'}
            </p>
          </div>
          <Button variant="outline" onClick={this.handleRetry}>
            重试
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
