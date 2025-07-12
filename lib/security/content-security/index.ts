/**
 * Content Security Module
 * 
 * Main entry point for CSP, CORS, and security headers
 */

import { NextRequest, NextResponse } from 'next/server'
import { CSPManager } from './csp-manager'
import { CORSHandler } from './cors-handler'
import { NonceGenerator } from './nonce-generator'
import { SecurityHeaders } from '../types'
import { getSettings } from '@/lib/settings'
import { SecurityContextManager } from '../context'

export class ContentSecurity {
  private static initialized = false
  private static securityHeaders: SecurityHeaders = {}

  /**
   * Initialize content security
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize sub-modules
      await Promise.all([
        CSPManager.initialize(),
        CORSHandler.initialize()
      ])

      // Load security headers from settings
      const settings = await getSettings()
      this.securityHeaders = settings.security?.contentSecurity?.headers || this.getDefaultHeaders()
      
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize content security:', error)
    }
  }

  /**
   * Get default security headers
   */
  private static getDefaultHeaders(): SecurityHeaders {
    return {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'Referrer-Policy': 'origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    }
  }

  /**
   * Apply security headers to response
   */
  static async applyHeaders(
    response: NextResponse,
    request: NextRequest,
    options?: {
      includeCSP?: boolean
      includeCORS?: boolean
      nonce?: string
    }
  ): Promise<NextResponse> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize()
    }

    // Apply basic security headers
    for (const [header, value] of Object.entries(this.securityHeaders)) {
      if (value) {
        response.headers.set(header, value)
      }
    }

    // Apply CSP if requested
    if (options?.includeCSP !== false) {
      const cspHeader = await CSPManager.generateHeader({
        nonce: options?.nonce
      })
      response.headers.set('Content-Security-Policy', cspHeader)
      
      // Add nonce to headers for client access
      if (options?.nonce) {
        response.headers.set('X-Nonce', options.nonce)
      }
    }

    // Apply CORS if requested
    if (options?.includeCORS !== false) {
      const origin = request.headers.get('origin')
      CORSHandler.addHeaders(response, origin)
    }

    return response
  }

  /**
   * Handle security for request
   */
  static async handle(request: NextRequest): Promise<NextResponse | null> {
    // Handle CORS preflight
    const corsResponse = await CORSHandler.handle(request)
    if (corsResponse) {
      return corsResponse
    }

    return null
  }

  /**
   * Generate nonce for request
   */
  static async generateNonce(requestId: string): Promise<string> {
    const nonce = NonceGenerator.generate()
    const context = SecurityContextManager.get()
    
    if (context) {
      await NonceGenerator.store(nonce, {
        requestId,
        ip: context.ip,
        path: new URL(context.requestId).pathname
      })
    }

    return nonce
  }

  /**
   * Handle CSP violation report
   */
  static async handleCSPViolation(request: NextRequest): Promise<NextResponse> {
    try {
      const report = await request.json()
      await CSPManager.handleViolation(report)
      
      return new NextResponse(null, { status: 204 })
    } catch (error) {
      console.error('Failed to handle CSP violation:', error)
      return new NextResponse('Invalid report', { status: 400 })
    }
  }

  /**
   * Get security statistics
   */
  static async getStats(): Promise<{
    cspViolations: Record<string, number>
    corsConfig: any
    securityHeaders: SecurityHeaders
  }> {
    const [cspViolations, corsConfig] = await Promise.all([
      CSPManager.getViolationStats(),
      CORSHandler.getConfig()
    ])

    return {
      cspViolations,
      corsConfig,
      securityHeaders: this.securityHeaders
    }
  }

  /**
   * Update security headers
   */
  static async updateHeaders(headers: Partial<SecurityHeaders>): Promise<void> {
    this.securityHeaders = {
      ...this.securityHeaders,
      ...headers
    }
  }
}

// Export sub-modules
export { CSPManager, CORSHandler, NonceGenerator }
export { useNonce } from './nonce-generator'

// Convenience functions
export async function applySecurityHeaders(
  response: NextResponse,
  request: NextRequest,
  options?: Parameters<typeof ContentSecurity.applyHeaders>[2]
): Promise<NextResponse> {
  return ContentSecurity.applyHeaders(response, request, options)
}

export async function handleContentSecurity(
  request: NextRequest
): Promise<NextResponse | null> {
  return ContentSecurity.handle(request)
}