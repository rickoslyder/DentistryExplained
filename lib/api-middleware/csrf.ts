import { NextRequest, NextResponse } from 'next/server'
import { validateCSRF } from '@/lib/csrf'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { MiddlewareFunction } from './types'

/**
 * CSRF protection middleware
 * Validates CSRF tokens for state-changing operations
 */
export const withCSRF: MiddlewareFunction = (handler) => {
  return async (request: NextRequest, context: any) => {
    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return handler(request, context)
    }

    const requestId = getRequestId(request)
    const validation = await validateCSRF(request)

    if (!validation.valid) {
      return ApiErrors.forbidden(
        validation.error || 'CSRF validation failed',
        requestId
      )
    }

    return handler(request, context)
  }
}