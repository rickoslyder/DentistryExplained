/**
 * Rate Limit Rules Engine
 * 
 * Dynamic rule evaluation for flexible rate limiting
 */

import { RateLimitRule, RateLimitConfig } from '../types'
import { getSettings } from '@/lib/settings'
import { SecurityContextManager } from '../context'
import { DistributedRateLimiter, createDistributedRateLimiter } from './distributed-limiter'

export class RateLimitRulesEngine {
  private rules: Map<string, RateLimitRule> = new Map()
  private limiters: Map<string, DistributedRateLimiter> = new Map()
  private initialized: boolean = false

  /**
   * Initialize rules from settings
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const settings = await getSettings()
      const rateLimitSettings = settings.security?.rateLimiting

      if (rateLimitSettings?.enabled && rateLimitSettings.rules) {
        // Load rules sorted by priority
        const sortedRules = [...rateLimitSettings.rules].sort((a, b) => b.priority - a.priority)
        
        for (const rule of sortedRules) {
          if (rule.enabled) {
            this.addRule(rule)
          }
        }
      }

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize rate limit rules:', error)
    }
  }

  /**
   * Add or update a rule
   */
  addRule(rule: RateLimitRule): void {
    this.rules.set(rule.id, rule)
    
    // Create rate limiter for this rule
    const limiter = createDistributedRateLimiter({
      windowMs: rule.windowMs,
      max: rule.max,
      message: `Rate limit exceeded: ${rule.name}`
    })
    
    this.limiters.set(rule.id, limiter)
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId)
    this.limiters.delete(ruleId)
  }

  /**
   * Evaluate rules for a request
   */
  async evaluate(request: {
    path: string
    method: string
    ip: string
    userId?: string
    apiKeyId?: string
    role?: string
  }): Promise<{ rule: RateLimitRule; limiter: DistributedRateLimiter } | null> {
    // Ensure rules are loaded
    if (!this.initialized) {
      await this.initialize()
    }

    // Find matching rule with highest priority
    for (const [ruleId, rule] of this.rules) {
      if (this.matchesRule(request, rule)) {
        const limiter = this.limiters.get(ruleId)
        if (limiter) {
          return { rule, limiter }
        }
      }
    }

    return null
  }

  /**
   * Check if request matches rule conditions
   */
  private matchesRule(
    request: {
      path: string
      method: string
      ip: string
      userId?: string
      apiKeyId?: string
      role?: string
    },
    rule: RateLimitRule
  ): boolean {
    // Check path patterns
    if (rule.paths && rule.paths.length > 0) {
      const pathMatches = rule.paths.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '.*'))
          return regex.test(request.path)
        }
        return request.path.startsWith(pattern)
      })
      if (!pathMatches) return false
    }

    // Check HTTP methods
    if (rule.methods && rule.methods.length > 0) {
      if (!rule.methods.includes(request.method)) return false
    }

    // Check user roles
    if (rule.roles && rule.roles.length > 0) {
      if (!request.role || !rule.roles.includes(request.role)) return false
    }

    // Check API keys
    if (rule.apiKeys && rule.apiKeys.length > 0) {
      if (!request.apiKeyId || !rule.apiKeys.includes(request.apiKeyId)) return false
    }

    // Check IP addresses
    if (rule.ips && rule.ips.length > 0) {
      const ipMatches = rule.ips.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp(pattern.replace(/\*/g, '\\d+'))
          return regex.test(request.ip)
        }
        return request.ip === pattern
      })
      if (!ipMatches) return false
    }

    return true
  }

  /**
   * Get rate limit key for request
   */
  getKey(
    request: {
      ip: string
      userId?: string
      apiKeyId?: string
    },
    rule: RateLimitRule
  ): string {
    const parts = [`rule:${rule.id}`]

    // Determine key components based on rule configuration
    if (rule.apiKeys && request.apiKeyId) {
      parts.push(`api:${request.apiKeyId}`)
    } else if (request.userId) {
      parts.push(`user:${request.userId}`)
    } else {
      parts.push(`ip:${request.ip}`)
    }

    return parts.join(':')
  }

  /**
   * Apply rate limiting based on rules
   */
  async apply(request: {
    path: string
    method: string
    ip: string
    userId?: string
    apiKeyId?: string
    role?: string
  }): Promise<void> {
    const match = await this.evaluate(request)
    
    if (!match) {
      // No matching rule, use default limits based on context
      const context = SecurityContextManager.get()
      if (context?.flags.has('api_key_used')) {
        // More lenient limits for API key users
        return
      }
      
      // Apply default rate limit
      const defaultLimiter = createDistributedRateLimiter({
        windowMs: 60000,
        max: 60,
        message: 'Too many requests'
      })
      
      const key = request.userId ? `user:${request.userId}` : `ip:${request.ip}`
      await defaultLimiter.consume(key)
      return
    }

    const { rule, limiter } = match
    const key = this.getKey(request, rule)
    
    // Apply the rate limit
    await limiter.consume(key)
  }

  /**
   * Get current usage for a request
   */
  async getUsage(request: {
    path: string
    method: string
    ip: string
    userId?: string
    apiKeyId?: string
    role?: string
  }): Promise<{ limit: number; current: number; resetAt: Date } | null> {
    const match = await this.evaluate(request)
    
    if (!match) return null

    const { rule, limiter } = match
    const key = this.getKey(request, rule)
    
    const { info } = await limiter.check(key)
    
    return {
      limit: rule.max,
      current: info.totalHits,
      resetAt: info.resetTime || new Date()
    }
  }

  /**
   * Get all active rules
   */
  getRules(): RateLimitRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Reload rules from settings
   */
  async reload(): Promise<void> {
    this.rules.clear()
    this.limiters.clear()
    this.initialized = false
    await this.initialize()
  }
}

// Export singleton instance
export const rateLimitRulesEngine = new RateLimitRulesEngine()

// Helper function to apply rate limiting to API routes
export async function applyRateLimitRules(req: Request): Promise<void> {
  const url = new URL(req.url)
  const context = SecurityContextManager.get()
  
  if (!context) {
    throw new Error('Security context not initialized')
  }

  await rateLimitRulesEngine.apply({
    path: url.pathname,
    method: req.method,
    ip: context.ip,
    userId: context.userId,
    apiKeyId: context.apiKeyId,
    role: undefined // Would be determined from user profile
  })
}