import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient, getCurrentUserProfile } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from './api-errors'
import { UserProfile } from '@/types/user'
import { validateCSRF } from '@/lib/csrf'
export { withAudit } from './api-middleware/audit'

// Type for API handler with context
export type ApiHandler<T = any> = (
  request: NextRequest,
  context: ApiContext & { params?: Promise<any> }
) => Promise<NextResponse<T>>

// Context passed to API handlers
export interface ApiContext {
  userId: string
  userProfile: UserProfile
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  requestId: string
}

// Wrapper for authenticated routes
export function withAuth<T = any>(
  handler: ApiHandler<T>,
  options?: {
    requireProfile?: boolean
    requireRole?: 'admin' | 'professional'
  }
): (request: NextRequest, routeContext?: any) => Promise<NextResponse> {
  return async (request: NextRequest, routeContext?: any) => {
    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        }
      })
    }

    try {
      // Check authentication
      const { userId } = await auth()
      if (!userId) {
        console.error('[withAuth] No userId from Clerk auth')
        return ApiErrors.unauthorized()
      }
      
      console.log('[withAuth] Authenticated userId:', userId)

      // Get user profile if needed
      let userProfile: UserProfile | null = null
      if (options?.requireProfile !== false) {
        userProfile = await getCurrentUserProfile()
        if (!userProfile) {
          console.error('[withAuth] Failed to get user profile for userId:', userId)
          return ApiErrors.notFound('User profile')
        }
        
        console.log('[withAuth] Got user profile:', userProfile.id)

        // Check role if specified
        if (options?.requireRole) {
          if (options.requireRole === 'admin' && userProfile.role !== 'admin') {
            return ApiErrors.forbidden('Admin access required')
          }
          if (options.requireRole === 'professional' && 
              userProfile.role !== 'professional' && 
              userProfile.role !== 'admin') {
            return ApiErrors.forbidden('Professional access required')
          }
        }
      }

      // Create context
      const context: ApiContext & { params?: Promise<any> } = {
        userId,
        userProfile: userProfile!,
        supabase: await createServerSupabaseClient(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        ...(routeContext || {})
      }

      // Call handler
      const response = await handler(request, context)
      
      // Add CORS headers to response
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      
      return response
    } catch (error) {
      return ApiErrors.internal(error, 'authentication')
    }
  }
}

// Wrapper for public routes with optional auth
export function withOptionalAuth<T = any>(
  handler: (
    request: NextRequest,
    context: Partial<ApiContext>
  ) => Promise<NextResponse<T>>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        }
      })
    }

    try {
      const { userId } = await auth()
      const context: Partial<ApiContext> = {
        supabase: await createServerSupabaseClient(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }

      if (userId) {
        context.userId = userId
        const userProfile = await getCurrentUserProfile()
        if (userProfile) {
          context.userProfile = userProfile
        }
      }

      const response = await handler(request, context)
      
      // Add CORS headers to response
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
      
      return response
    } catch (error) {
      return ApiErrors.internal(error, 'optional auth')
    }
  }
}

// Re-export rate limiting from dedicated module
export { withRateLimit, rateLimiters, getRateLimitStats } from './rate-limiter'

// Request body size limit
export function withBodyLimit(maxSizeBytes: number = 1048576) { // 1MB default
  return <T extends (...args: any[]) => any>(handler: T): T => {
    return (async (...args: Parameters<T>) => {
      const request = args[0] as NextRequest
      
      const contentLength = request.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > maxSizeBytes) {
        return ApiErrors.invalidInput(
          `Request body too large. Maximum size: ${maxSizeBytes} bytes`
        )
      }

      return handler(...args)
    }) as T
  }
}

// CORS helper for specific routes
export function withCORS(
  allowedOrigins: string[] = ['*'],
  allowedMethods: string[] = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
) {
  return <T extends (...args: any[]) => any>(handler: T): T => {
    return (async (...args: Parameters<T>) => {
      const request = args[0] as NextRequest
      const origin = request.headers.get('origin') || ''

      // Handle preflight
      if (request.method === 'OPTIONS') {
        const headers = new Headers({
          'Access-Control-Allow-Methods': allowedMethods.join(', '),
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
          'Access-Control-Max-Age': '86400',
          'Access-Control-Allow-Credentials': 'true'
        })

        // Set origin header based on allowed origins
        if (allowedOrigins.includes('*')) {
          headers.set('Access-Control-Allow-Origin', '*')
        } else if (allowedOrigins.includes(origin)) {
          headers.set('Access-Control-Allow-Origin', origin)
          headers.set('Vary', 'Origin')
        }

        return new NextResponse(null, { status: 200, headers })
      }

      const response = await handler(...args)
      
      // Add CORS headers to response
      if (allowedOrigins.includes('*')) {
        response.headers.set('Access-Control-Allow-Origin', '*')
      } else if (allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin)
        response.headers.set('Vary', 'Origin')
      }
      
      response.headers.set('Access-Control-Allow-Credentials', 'true')

      return response
    }) as T
  }
}

// CSRF protection middleware
export function withCSRF<T extends (...args: any[]) => any>(handler: T): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest
    
    // Skip CSRF check for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return handler(...args)
    }

    const requestId = getRequestId(request)
    const validation = await validateCSRF(request)

    if (!validation.valid) {
      return ApiErrors.forbidden(
        validation.error || 'CSRF validation failed',
        requestId
      )
    }

    return handler(...args)
  }) as T
}

// Compose multiple middleware
export function compose<T extends (...args: any[]) => any>(
  ...middleware: Array<(handler: T) => T>
): (handler: T) => T {
  return (handler: T) => {
    return middleware.reduceRight((acc, fn) => fn(acc), handler)
  }
}