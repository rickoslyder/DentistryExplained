/**
 * Security System Main Module
 * 
 * Comprehensive security system for Dentistry Explained
 */

import { NextRequest, NextResponse } from 'next/server'
import { SecurityContextManager } from './context'
import type { SecurityContext } from './context'
import { rateLimitRulesEngine, applyRateLimitRules } from './rate-limiter/rules-engine'
import { validateAPIKey } from './rate-limiter/api-key-manager'
import { ddosProtection } from './ddos-protection'
import { ContentSecurity, handleContentSecurity, applySecurityHeaders } from './content-security'
import { SecurityMonitoring, analyzeSecurityThreat } from './monitoring'
import { RequestValidator, validateRequest } from './validation/request-validator'
import { getSettings } from '@/lib/settings'

export class SecuritySystem {
  private static initialized = false

  /**
   * Initialize security system
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize all security modules
      await Promise.all([
        rateLimitRulesEngine.initialize(),
        ContentSecurity.initialize(),
        SecurityMonitoring.initialize()
      ])

      RequestValidator.initialize()
      
      this.initialized = true
      console.log('Security system initialized successfully')
    } catch (error) {
      console.error('Failed to initialize security system:', error)
    }
  }

  /**
   * Main security middleware
   */
  static async protect(req: NextRequest): Promise<NextResponse | null> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize()
    }

    // Create security context
    const context = await SecurityContextManager.createFromRequest(req)
    
    return SecurityContextManager.run(context, async () => {
      try {
        // 1. Check API key if present
        const apiKeyResult = await validateAPIKey(req)
        if (apiKeyResult) {
          if (!apiKeyResult.valid) {
            return new NextResponse('Invalid API key', { status: 401 })
          }
          context.apiKeyId = apiKeyResult.key!.id
          SecurityContextManager.addFlag('api_key_used')
        }

        // 2. Apply DDoS protection
        const ddosResponse = await ddosProtection(req)
        if (ddosResponse) {
          return ddosResponse
        }

        // 3. Apply rate limiting
        try {
          await applyRateLimitRules(req)
        } catch (error) {
          if (error.code === 'RATE_LIMIT_EXCEEDED') {
            return new NextResponse(error.message, {
              status: 429,
              headers: {
                'Retry-After': error.details?.retryAfter?.toString() || '60'
              }
            })
          }
          throw error
        }

        // 4. Validate request
        const validation = await validateRequest(req)
        if (!validation.valid) {
          return new NextResponse(
            JSON.stringify({ 
              error: 'Invalid request',
              details: validation.errors 
            }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }

        // 5. Analyze for threats
        const threatAnalysis = await analyzeSecurityThreat(req)
        if (!threatAnalysis.allowed) {
          if (threatAnalysis.challenge) {
            // Would return challenge page
            return new NextResponse('Security challenge required', { status: 403 })
          }
          return new NextResponse(threatAnalysis.reason || 'Access denied', { status: 403 })
        }

        // 6. Handle content security
        const contentSecurityResponse = await handleContentSecurity(req)
        if (contentSecurityResponse) {
          return contentSecurityResponse
        }

        // All checks passed
        return null
      } catch (error) {
        console.error('Security system error:', error)
        // Don't expose internal errors
        return new NextResponse('Security check failed', { status: 500 })
      }
    })
  }

  /**
   * Apply security headers to response
   */
  static async enhanceResponse(
    response: NextResponse,
    request: NextRequest
  ): Promise<NextResponse> {
    const context = SecurityContextManager.get()
    
    // Generate nonce if CSP is enabled
    const nonce = context ? await ContentSecurity.generateNonce(context.requestId) : undefined
    
    // Apply security headers
    const enhanced = await applySecurityHeaders(response, request, { nonce })
    
    // Add custom headers based on context
    if (context) {
      enhanced.headers.set('X-Request-ID', context.requestId)
      
      if (context.threatScore > 50) {
        enhanced.headers.set('X-Security-Score', context.threatScore.toString())
      }
    }

    return enhanced
  }

  /**
   * Get security status
   */
  static async getStatus(): Promise<{
    initialized: boolean
    modules: Record<string, boolean>
    health: Record<string, any>
  }> {
    const settings = await getSettings()
    
    return {
      initialized: this.initialized,
      modules: {
        rateLimit: settings.security?.rateLimiting?.enabled ?? true,
        ddos: settings.security?.ddosProtection?.enabled ?? true,
        csp: settings.security?.contentSecurity?.csp?.enabled ?? true,
        monitoring: true
      },
      health: await SecurityMonitoring.getDashboard()
    }
  }
}

// Export all security modules
export * from './types'
export { SecurityContextManager, getSecurityContext } from './context'
export type { SecurityContext } from './context'
export * from './rate-limiter/distributed-limiter'
export * from './rate-limiter/rules-engine'
export * from './rate-limiter/api-key-manager'
export * from './ddos-protection'
export * from './content-security'
export * from './monitoring'
export * from './validation/request-validator'

// Convenience functions
export async function initializeSecurity(): Promise<void> {
  return SecuritySystem.initialize()
}

export async function securityMiddleware(req: NextRequest): Promise<NextResponse | null> {
  return SecuritySystem.protect(req)
}

export async function enhanceSecurityResponse(
  response: NextResponse,
  request: NextRequest
): Promise<NextResponse> {
  return SecuritySystem.enhanceResponse(response, request)
}