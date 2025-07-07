'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface WidgetErrorBoundaryProps {
  children: React.ReactNode
  widgetName?: string
}

export class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Widget error:', {
      widget: this.props.widgetName,
      error,
      errorInfo,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Widget Error</AlertTitle>
          <AlertDescription>
            {this.props.widgetName
              ? `The ${this.props.widgetName} widget encountered an error.`
              : 'This widget encountered an error.'}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-2 text-xs overflow-auto">
                {this.state.error.message}
              </pre>
            )}
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}