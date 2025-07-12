/**
 * Security Context Management
 * 
 * Manages security context for each request
 */

import { AsyncLocalStorage } from 'node:async_hooks'
import { SecurityContext, GeoInfo, SecurityFlag } from './types'
import { headers } from 'next/headers'

// Create async local storage for security context
const securityContextStorage = new AsyncLocalStorage<SecurityContext>()

export class SecurityContextManager {
  /**
   * Run a function with security context
   */
  static async run<T>(
    context: SecurityContext,
    fn: () => T | Promise<T>
  ): Promise<T> {
    return securityContextStorage.run(context, fn)
  }

  /**
   * Get current security context
   */
  static get(): SecurityContext | undefined {
    return securityContextStorage.getStore()
  }

  /**
   * Update security context
   */
  static update(updates: Partial<SecurityContext>): void {
    const current = this.get()
    if (!current) {
      throw new Error('No security context available')
    }

    Object.assign(current, updates)
  }

  /**
   * Add a security flag
   */
  static addFlag(flag: SecurityFlag): void {
    const context = this.get()
    if (context) {
      context.flags.add(flag)
    }
  }

  /**
   * Check if a flag is set
   */
  static hasFlag(flag: SecurityFlag): boolean {
    const context = this.get()
    return context?.flags.has(flag) || false
  }

  /**
   * Update threat score
   */
  static updateThreatScore(delta: number): void {
    const context = this.get()
    if (context) {
      context.threatScore = Math.max(0, Math.min(100, context.threatScore + delta))
    }
  }

  /**
   * Create context from request
   */
  static async createFromRequest(req: Request): Promise<SecurityContext> {
    const headersList = await headers()
    const requestId = crypto.randomUUID()
    
    // Extract IP address
    const ip = this.extractIP(headersList)
    
    // Extract user agent
    const userAgent = headersList.get('user-agent') || undefined
    
    // Create base context
    const context: SecurityContext = {
      requestId,
      ip,
      userAgent,
      threatScore: 0,
      flags: new Set()
    }

    return context
  }

  /**
   * Extract IP address from headers
   */
  private static extractIP(headers: Headers | ReadonlyHeaders): string {
    // Check various headers for IP address
    const forwardedFor = headers.get('x-forwarded-for')
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim()
    }

    const realIP = headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }

    const cfConnectingIP = headers.get('cf-connecting-ip')
    if (cfConnectingIP) {
      return cfConnectingIP
    }

    // Default to localhost if no IP found
    return '127.0.0.1'
  }

  /**
   * Extract geo information from Cloudflare headers
   */
  static extractGeoInfo(headers: Headers | ReadonlyHeaders): GeoInfo | undefined {
    const country = headers.get('cf-ipcountry')
    const city = headers.get('cf-ipcity')
    const region = headers.get('cf-ipregion')
    const latitude = headers.get('cf-iplatitude')
    const longitude = headers.get('cf-iplongitude')
    const timezone = headers.get('cf-timezone')

    if (!country) {
      return undefined
    }

    return {
      country,
      city: city || undefined,
      region: region || undefined,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      timezone: timezone || undefined
    }
  }
}

// Export singleton instance
export const securityContext = SecurityContextManager

// Helper to get required context
export function getSecurityContext(): SecurityContext {
  const context = SecurityContextManager.get()
  if (!context) {
    throw new Error('Security context not initialized')
  }
  return context
}

// Helper to check if request is from a trusted source
export function isTrustedRequest(): boolean {
  const context = SecurityContextManager.get()
  if (!context) {
    return false
  }

  return (
    context.flags.has('whitelist') ||
    context.threatScore < 30 ||
    context.flags.has('api_key_used')
  )
}