import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient, getCurrentUserProfile } from '@/lib/supabase-auth'
import { ApiErrors } from './api-errors'
import { UserProfile } from '@/types/user'

// Type for API handler with context
export type ApiHandler<T = any> = (
  request: NextRequest,
  context: ApiContext
) => Promise<NextResponse<T>>

// Context passed to API handlers
export interface ApiContext {
  userId: string
  userProfile: UserProfile
  supabase: ReturnType<typeof createServerSupabaseClient>
  requestId: string
}

// Wrapper for authenticated routes
export function withAuth<T = any>(
  handler: ApiHandler<T>,
  options?: {
    requireProfile?: boolean
    requireRole?: 'admin' | 'professional'
  }
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
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
      const context: ApiContext = {
        userId,
        userProfile: userProfile!,
        supabase: await createServerSupabaseClient(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }

      // Call handler
      return await handler(request, context)
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

      return await handler(request, context)
    } catch (error) {
      return ApiErrors.internal(error, 'optional auth')
    }
  }
}

// Rate limiting helper (basic in-memory implementation)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function withRateLimit(
  windowMs: number = 60000, // 1 minute
  maxRequests: number = 60
) {
  return <T extends (...args: any[]) => any>(handler: T): T => {
    return (async (...args: Parameters<T>) => {
      const request = args[0] as NextRequest
      const identifier = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'anonymous'

      const now = Date.now()
      const userLimit = rateLimitStore.get(identifier)

      if (userLimit) {
        if (userLimit.resetAt > now) {
          if (userLimit.count >= maxRequests) {
            const retryAfter = Math.ceil((userLimit.resetAt - now) / 1000)
            return ApiErrors.rateLimit(retryAfter)
          }
          userLimit.count++
        } else {
          // Reset window
          userLimit.count = 1
          userLimit.resetAt = now + windowMs
        }
      } else {
        rateLimitStore.set(identifier, {
          count: 1,
          resetAt: now + windowMs
        })
      }

      // Clean up old entries periodically
      if (rateLimitStore.size > 1000) {
        for (const [key, value] of rateLimitStore.entries()) {
          if (value.resetAt < now) {
            rateLimitStore.delete(key)
          }
        }
      }

      return handler(...args)
    }) as T
  }
}

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
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': allowedOrigins.includes('*') ? '*' : 
              (allowedOrigins.includes(origin) ? origin : ''),
            'Access-Control-Allow-Methods': allowedMethods.join(', '),
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
          }
        })
      }

      const response = await handler(...args)
      
      // Add CORS headers to response
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        response.headers.set(
          'Access-Control-Allow-Origin', 
          allowedOrigins.includes('*') ? '*' : origin
        )
      }

      return response
    }) as T
  }
}

// Compose multiple middleware
export function compose<T extends (...args: any[]) => any>(
  ...middleware: Array<(handler: T) => T>
): (handler: T) => T {
  return (handler: T) => {
    return middleware.reduceRight((acc, fn) => fn(acc), handler)
  }
}