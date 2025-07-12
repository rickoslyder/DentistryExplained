/**
 * CORS Handler
 * 
 * Dynamic CORS configuration per route
 */

import { NextRequest, NextResponse } from 'next/server'
import { CORSConfig } from '../types'
import { getSettings } from '@/lib/settings'
import { SecurityContextManager } from '../context'

export class CORSHandler {
  private static config: CORSConfig | null = null
  private static initialized = false

  /**
   * Initialize CORS configuration
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const settings = await getSettings()
      this.config = settings.security?.contentSecurity?.cors || this.getDefaultConfig()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize CORS:', error)
      this.config = this.getDefaultConfig()
    }
  }

  /**
   * Get default CORS configuration
   */
  private static getDefaultConfig(): CORSConfig {
    return {
      enabled: true,
      origins: [
        process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
        'https://dentistry-explained.vercel.app',
        'https://dentistryexplained.com',
        'https://www.dentistryexplained.com'
      ].filter(Boolean),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      headers: [
        'X-CSRF-Token',
        'X-Requested-With',
        'Accept',
        'Accept-Version',
        'Content-Length',
        'Content-MD5',
        'Content-Type',
        'Date',
        'X-Api-Version',
        'Authorization',
        'Clerk-Backend-API-URL',
        'Clerk-Frontend-API-URL'
      ],
      credentials: true,
      maxAge: 86400 // 24 hours
    }
  }

  /**
   * Handle CORS for request
   */
  static async handle(req: NextRequest): Promise<NextResponse | null> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize()
    }

    if (!this.config?.enabled) {
      return null
    }

    const origin = req.headers.get('origin')
    const method = req.method

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return this.handlePreflight(req, origin)
    }

    // Check if origin is allowed
    if (origin && !this.isOriginAllowed(origin)) {
      // Log suspicious activity
      const context = SecurityContextManager.get()
      if (context) {
        SecurityContextManager.updateThreatScore(5)
      }
      
      console.warn('CORS violation:', { origin, url: req.url })
      return null
    }

    return null
  }

  /**
   * Add CORS headers to response
   */
  static addHeaders(response: NextResponse, origin?: string | null): NextResponse {
    if (!this.config?.enabled) {
      return response
    }

    // Set allowed origin
    if (origin && this.isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    } else if (this.config.origins.includes('*')) {
      response.headers.set('Access-Control-Allow-Origin', '*')
    }

    // Set other CORS headers
    if (this.config.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    response.headers.set(
      'Access-Control-Allow-Methods',
      this.config.methods.join(', ')
    )

    response.headers.set(
      'Access-Control-Allow-Headers',
      this.config.headers.join(', ')
    )

    response.headers.set(
      'Access-Control-Max-Age',
      this.config.maxAge.toString()
    )

    // Add Vary header for proper caching
    const vary = response.headers.get('Vary')
    if (vary) {
      response.headers.set('Vary', `${vary}, Origin`)
    } else {
      response.headers.set('Vary', 'Origin')
    }

    return response
  }

  /**
   * Handle preflight request
   */
  private static handlePreflight(req: NextRequest, origin: string | null): NextResponse {
    const requestMethod = req.headers.get('Access-Control-Request-Method')
    const requestHeaders = req.headers.get('Access-Control-Request-Headers')

    // Check if method is allowed
    if (requestMethod && !this.config!.methods.includes(requestMethod)) {
      return new NextResponse(null, { status: 405 })
    }

    // Check if headers are allowed
    if (requestHeaders) {
      const headers = requestHeaders.split(',').map(h => h.trim())
      const allowed = headers.every(h => 
        this.config!.headers.some(allowed => 
          allowed.toLowerCase() === h.toLowerCase()
        )
      )
      
      if (!allowed) {
        return new NextResponse(null, { status: 403 })
      }
    }

    // Create response with CORS headers
    const response = new NextResponse(null, { status: 200 })
    return this.addHeaders(response, origin)
  }

  /**
   * Check if origin is allowed
   */
  private static isOriginAllowed(origin: string): boolean {
    if (!this.config) return false

    // Check exact match
    if (this.config.origins.includes(origin)) {
      return true
    }

    // Check wildcard
    if (this.config.origins.includes('*')) {
      return true
    }

    // Check pattern matching
    for (const allowed of this.config.origins) {
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*')
        const regex = new RegExp(`^${pattern}$`)
        if (regex.test(origin)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Add allowed origin
   */
  static async addAllowedOrigin(origin: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    if (!this.config!.origins.includes(origin)) {
      this.config!.origins.push(origin)
    }
  }

  /**
   * Remove allowed origin
   */
  static async removeAllowedOrigin(origin: string): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    const index = this.config!.origins.indexOf(origin)
    if (index > -1) {
      this.config!.origins.splice(index, 1)
    }
  }

  /**
   * Get current configuration
   */
  static async getConfig(): Promise<CORSConfig> {
    if (!this.initialized) {
      await this.initialize()
    }
    return this.config!
  }

  /**
   * Update configuration
   */
  static async updateConfig(updates: Partial<CORSConfig>): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    this.config = {
      ...this.config!,
      ...updates
    }
  }
}