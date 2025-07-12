/**
 * Distributed Rate Limiter
 * 
 * Redis-backed rate limiting for multi-instance deployments
 */

import { redis } from '@/lib/upstash'
import { 
  RateLimitConfig, 
  RateLimitInfo, 
  RateLimitStore,
  SecurityError 
} from '../types'
import { SecurityContextManager } from '../context'
import { cacheManager } from '@/lib/cache'

export class DistributedRateLimitStore implements RateLimitStore {
  private prefix: string
  private windowMs: number

  constructor(prefix: string = 'ratelimit:', windowMs: number = 60000) {
    this.prefix = prefix
    this.windowMs = windowMs
  }

  async increment(key: string): Promise<RateLimitInfo> {
    const fullKey = `${this.prefix}${key}`
    const now = Date.now()
    const window = Math.floor(now / this.windowMs)
    const resetTime = (window + 1) * this.windowMs

    try {
      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline()
      
      // Increment counter with expiry
      pipeline.incr(`${fullKey}:${window}`)
      pipeline.expire(`${fullKey}:${window}`, Math.ceil(this.windowMs / 1000) + 60) // Add buffer
      
      // Get current and previous window counts for sliding window
      pipeline.get(`${fullKey}:${window}`)
      pipeline.get(`${fullKey}:${window - 1}`)
      
      const results = await pipeline.exec()
      
      const currentCount = Number(results[2] || 1)
      const previousCount = Number(results[3] || 0)
      
      // Calculate weighted count for sliding window
      const windowProgress = (now % this.windowMs) / this.windowMs
      const weightedCount = previousCount * (1 - windowProgress) + currentCount

      return {
        totalHits: Math.ceil(weightedCount),
        resetTime: new Date(resetTime)
      }
    } catch (error) {
      console.error('Redis rate limit error:', error)
      // Fallback to memory store
      return this.incrementMemory(key)
    }
  }

  async decrement(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`
    const window = Math.floor(Date.now() / this.windowMs)
    
    try {
      await redis.decr(`${fullKey}:${window}`)
    } catch (error) {
      console.error('Redis decrement error:', error)
    }
  }

  async resetKey(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`
    const window = Math.floor(Date.now() / this.windowMs)
    
    try {
      await redis.del(`${fullKey}:${window}`, `${fullKey}:${window - 1}`)
    } catch (error) {
      console.error('Redis reset error:', error)
    }
  }

  async resetAll(): Promise<void> {
    try {
      // Get all rate limit keys
      const keys = await redis.keys(`${this.prefix}*`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Redis reset all error:', error)
    }
  }

  // Memory fallback for Redis failures
  private memoryStore = new Map<string, { count: number; resetAt: number }>()
  
  private async incrementMemory(key: string): Promise<RateLimitInfo> {
    const now = Date.now()
    const entry = this.memoryStore.get(key)
    
    if (!entry || entry.resetAt <= now) {
      const resetAt = now + this.windowMs
      this.memoryStore.set(key, { count: 1, resetAt })
      return { totalHits: 1, resetTime: new Date(resetAt) }
    }
    
    entry.count++
    return { totalHits: entry.count, resetTime: new Date(entry.resetAt) }
  }
}

export class DistributedRateLimiter {
  private config: RateLimitConfig
  private store: RateLimitStore

  constructor(config: RateLimitConfig) {
    this.config = config
    this.store = config.store || new DistributedRateLimitStore('ratelimit:', config.windowMs)
  }

  async check(key: string): Promise<{ allowed: boolean; info: RateLimitInfo }> {
    const info = await this.store.increment(key)
    const allowed = info.totalHits <= this.config.max

    // Update security context
    const context = SecurityContextManager.get()
    if (context) {
      context.rateLimitInfo = info
      if (!allowed) {
        SecurityContextManager.addFlag('rate_limited')
        SecurityContextManager.updateThreatScore(10)
      }
    }

    // Log to monitoring if limit exceeded
    if (!allowed && this.config.handler) {
      await this.logRateLimitExceeded(key, info)
    }

    return { allowed, info }
  }

  async consume(key: string): Promise<RateLimitInfo> {
    const { allowed, info } = await this.check(key)
    
    if (!allowed) {
      const retryAfter = info.resetTime 
        ? Math.ceil((info.resetTime.getTime() - Date.now()) / 1000)
        : 60

      throw new SecurityError(
        this.config.message || 'Too many requests',
        'RATE_LIMIT_EXCEEDED',
        429,
        { retryAfter, limit: this.config.max, current: info.totalHits }
      )
    }

    return info
  }

  private async logRateLimitExceeded(key: string, info: RateLimitInfo): Promise<void> {
    try {
      // Cache rate limit violations for monitoring
      const violationKey = `ratelimit:violations:${key}`
      const violations = await cacheManager.get<number>(violationKey) || 0
      await cacheManager.set(violationKey, violations + 1, { ttl: 3600 }) // 1 hour

      // Log to security events (would be implemented in monitoring module)
      console.warn('Rate limit exceeded:', {
        key,
        hits: info.totalHits,
        limit: this.config.max,
        resetTime: info.resetTime
      })
    } catch (error) {
      console.error('Failed to log rate limit violation:', error)
    }
  }
}

// Factory function for creating rate limiters
export function createDistributedRateLimiter(
  options: Partial<RateLimitConfig> & { windowMs: number; max: number }
): DistributedRateLimiter {
  return new DistributedRateLimiter({
    ...options,
    store: options.store || new DistributedRateLimitStore('ratelimit:', options.windowMs)
  })
}

// Preset configurations
export const distributedRateLimiters = {
  // General API rate limit
  api: createDistributedRateLimiter({
    windowMs: 60000, // 1 minute
    max: 60,
    message: 'Too many API requests'
  }),

  // Stricter limit for auth endpoints
  auth: createDistributedRateLimiter({
    windowMs: 900000, // 15 minutes
    max: 5,
    message: 'Too many authentication attempts',
    skipSuccessfulRequests: true
  }),

  // Search endpoint limit
  search: createDistributedRateLimiter({
    windowMs: 60000, // 1 minute
    max: 30,
    message: 'Too many search requests'
  }),

  // AI chat limit
  chat: createDistributedRateLimiter({
    windowMs: 60000, // 1 minute
    max: 30,
    message: 'Too many chat messages'
  }),

  // File upload limit
  upload: createDistributedRateLimiter({
    windowMs: 3600000, // 1 hour
    max: 20,
    message: 'Too many file uploads'
  }),

  // Admin operations
  admin: createDistributedRateLimiter({
    windowMs: 60000, // 1 minute
    max: 100,
    message: 'Too many admin requests'
  })
}