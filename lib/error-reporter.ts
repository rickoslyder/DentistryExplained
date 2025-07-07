import { supabase } from './supabase'

interface ErrorReport {
  error_type: string
  message: string
  stack_trace?: string
  url?: string
  user_agent?: string
  metadata?: Record<string, any>
}

class ErrorReporter {
  private supabase = supabase
  private queue: ErrorReport[] = []
  private isReporting = false

  async report(error: Error | ErrorEvent, additionalInfo?: Record<string, any>) {
    try {
      const errorReport: ErrorReport = {
        error_type: error.constructor.name || 'UnknownError',
        message: error.message || 'Unknown error occurred',
        stack_trace: (error as Error).stack,
        url: window.location.href,
        user_agent: navigator.userAgent,
        metadata: {
          ...additionalInfo,
          timestamp: new Date().toISOString(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
          screen: {
            width: window.screen.width,
            height: window.screen.height,
          },
        },
      }

      // Add to queue
      this.queue.push(errorReport)

      // Process queue
      await this.processQueue()
    } catch (reportError) {
      console.error('Failed to report error:', reportError)
    }
  }

  private async processQueue() {
    if (this.isReporting || this.queue.length === 0) return

    this.isReporting = true

    try {
      // Process up to 10 errors at a time
      const batch = this.queue.splice(0, 10)

      for (const errorReport of batch) {
        await this.supabase
          .from('error_logs')
          .insert({
            error_type: errorReport.error_type,
            message: errorReport.message,
            stack_trace: errorReport.stack_trace,
            url: errorReport.url,
            user_agent: errorReport.user_agent,
            metadata: errorReport.metadata,
          })
      }
    } catch (error) {
      console.error('Failed to send error reports:', error)
      // Re-add failed reports to queue
      // Note: In production, you might want to limit retries
    } finally {
      this.isReporting = false

      // Process remaining items if any
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 1000)
      }
    }
  }

  // Install global error handlers
  install() {
    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.report(event.error || event, {
        type: 'unhandled_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    })

    // Handle promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.report(new Error(event.reason), {
        type: 'unhandled_rejection',
        promise: String(event.promise),
        reason: event.reason,
      })
    })

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Error reporter installed')
    }
  }
}

// Create singleton instance
export const errorReporter = new ErrorReporter()

// Helper function for manual error reporting
export function reportError(error: Error | string, context?: Record<string, any>) {
  const errorObj = typeof error === 'string' ? new Error(error) : error
  errorReporter.report(errorObj, context)
}