/**
 * CSP Nonce Generator
 * 
 * Generates and manages nonces for Content Security Policy
 */

import { randomBytes } from 'crypto'
import { headers } from 'next/headers'
import { cacheManager } from '@/lib/cache'

export class NonceGenerator {
  private static readonly NONCE_LENGTH = 16
  private static readonly CACHE_PREFIX = 'csp:nonce:'
  private static readonly CACHE_TTL = 300 // 5 minutes

  /**
   * Generate a new nonce
   */
  static generate(): string {
    return randomBytes(this.NONCE_LENGTH).toString('base64')
  }

  /**
   * Store nonce with request context
   */
  static async store(nonce: string, context: {
    requestId: string
    ip: string
    path: string
  }): Promise<void> {
    const key = `${this.CACHE_PREFIX}${nonce}`
    await cacheManager.set(key, context, { 
      ttl: this.CACHE_TTL,
      tags: ['csp-nonce']
    })
  }

  /**
   * Validate nonce
   */
  static async validate(nonce: string): Promise<boolean> {
    const key = `${this.CACHE_PREFIX}${nonce}`
    const context = await cacheManager.get(key)
    
    if (!context) {
      return false
    }

    // Nonce can only be used once
    await cacheManager.delete(key)
    
    return true
  }

  /**
   * Get nonce from headers
   */
  static async getFromHeaders(): Promise<string | undefined> {
    try {
      const headersList = await headers()
      return headersList.get('x-nonce') || undefined
    } catch {
      return undefined
    }
  }

  /**
   * Create nonce attributes for HTML elements
   */
  static getAttributes(nonce?: string): { nonce?: string } {
    if (!nonce) return {}
    return { nonce }
  }

  /**
   * Create React props with nonce
   */
  static getProps(nonce?: string): Record<string, any> {
    if (!nonce) return {}
    return { nonce }
  }

  /**
   * Clean up expired nonces
   */
  static async cleanup(): Promise<void> {
    // This would typically be done by cache expiration
    // but we can force cleanup if needed
    await cacheManager.invalidateByTags(['csp-nonce'])
  }
}

/**
 * React hook for using nonce in components (client-side only)
 */
export function useNonce(): string | undefined {
  if (typeof window !== 'undefined') {
    // Client-side: get nonce from meta tag
    const meta = document.querySelector('meta[name="csp-nonce"]')
    return meta?.getAttribute('content') || undefined
  }
  
  // Server-side components should use getNonce()
  return undefined
}

/**
 * Get nonce for server components
 */
export async function getNonce(): Promise<string | undefined> {
  return NonceGenerator.getFromHeaders()
}

