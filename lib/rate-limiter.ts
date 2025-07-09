import { NextRequest } from 'next/server'
import { ApiErrors } from './api-errors'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
  handler?: (req: NextRequest, res: any) => any
  onLimitReached?: (req: NextRequest, key: string) => void
}

interface RateLimitEntry {
  count: number
  resetAt: number
  firstRequestAt: number
  lastRequestAt: number
  blockedCount: number
}

// Store for rate limit data
const rateLimitStore = new Map<string, RateLimitEntry>()

// Store for monitoring data
const monitoringData = {
  totalRequests: 0,
  blockedRequests: 0,
  uniqueClients: new Set<string>(),
  heavyUsers: new Map<string, number>(), // Track users with high request counts
  lastCleanup: Date.now(),
}

// Default key generator
const defaultKeyGenerator = (req: NextRequest): string => {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         req.headers.get('cf-connecting-ip') || // Cloudflare
         'anonymous'
}

// Clean up expired entries
const cleanupExpiredEntries = () => {
  const now = Date.now()
  const oneHourAgo = now - 3600000 // 1 hour
  
  if (now - monitoringData.lastCleanup < 300000) { // Clean every 5 minutes
    return
  }
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
  
  // Clean up heavy users tracking
  for (const [key, timestamp] of monitoringData.heavyUsers.entries()) {
    if (timestamp < oneHourAgo) {
      monitoringData.heavyUsers.delete(key)
    }
  }
  
  monitoringData.lastCleanup = now
}

/**
 * Create a rate limiter with the given configuration
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = defaultKeyGenerator,
    onLimitReached,
  } = config

  return async (req: NextRequest, next: () => Promise<any>) => {
    const key = keyGenerator(req)
    const now = Date.now()
    
    // Track unique clients
    monitoringData.uniqueClients.add(key)
    monitoringData.totalRequests++
    
    // Clean up periodically
    cleanupExpiredEntries()
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key)
    
    if (!entry || entry.resetAt <= now) {
      // Create new entry
      entry = {
        count: 1,
        resetAt: now + windowMs,
        firstRequestAt: now,
        lastRequestAt: now,
        blockedCount: 0,
      }
      rateLimitStore.set(key, entry)
    } else {
      // Update existing entry
      entry.count++
      entry.lastRequestAt = now
      
      // Check if limit exceeded
      if (entry.count > maxRequests) {
        entry.blockedCount++
        monitoringData.blockedRequests++
        
        // Track heavy users
        if (entry.blockedCount > 5) {
          monitoringData.heavyUsers.set(key, now)
        }
        
        // Call limit reached handler if provided
        if (onLimitReached) {
          onLimitReached(req, key)
        }
        
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
        return ApiErrors.rateLimit(retryAfter)
      }
    }
    
    try {
      // Execute the handler
      const response = await next()
      
      // Skip counting successful requests if configured
      if (skipSuccessfulRequests && response.status < 400) {
        entry.count--
      }
      
      return response
    } catch (error) {
      // Skip counting failed requests if configured
      if (skipFailedRequests) {
        entry.count--
      }
      throw error
    }
  }
}

/**
 * Global rate limiter instances for different use cases
 */
export const rateLimiters = {
  // General API rate limit
  api: createRateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 60,
    onLimitReached: (req, key) => {
      console.warn(`Rate limit reached for ${key} on ${req.url}`)
    }
  }),
  
  // Stricter limit for auth endpoints
  auth: createRateLimiter({
    windowMs: 900000, // 15 minutes
    maxRequests: 5,
    skipSuccessfulRequests: true, // Only count failed attempts
    onLimitReached: (req, key) => {
      console.error(`Auth rate limit reached for ${key}`)
    }
  }),
  
  // Search endpoint limit
  search: createRateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 30,
  }),
  
  // AI chat limit
  chat: createRateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 30, // Increased from 10 to 30 for better UX
    onLimitReached: (req, key) => {
      console.warn(`Chat rate limit reached for ${key}`)
    }
  }),
  
  // File upload limit
  upload: createRateLimiter({
    windowMs: 3600000, // 1 hour
    maxRequests: 20,
  }),
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats() {
  const now = Date.now()
  const activeEntries = Array.from(rateLimitStore.entries())
    .filter(([_, entry]) => entry.resetAt > now)
  
  const topOffenders = Array.from(activeEntries)
    .sort((a, b) => b[1].blockedCount - a[1].blockedCount)
    .slice(0, 10)
    .map(([key, entry]) => ({
      key,
      requests: entry.count,
      blocked: entry.blockedCount,
      firstRequest: new Date(entry.firstRequestAt).toISOString(),
      lastRequest: new Date(entry.lastRequestAt).toISOString(),
    }))
  
  return {
    totalRequests: monitoringData.totalRequests,
    blockedRequests: monitoringData.blockedRequests,
    blockRate: monitoringData.totalRequests > 0 
      ? (monitoringData.blockedRequests / monitoringData.totalRequests * 100).toFixed(2) + '%'
      : '0%',
    uniqueClients: monitoringData.uniqueClients.size,
    activeEntries: activeEntries.length,
    heavyUsers: monitoringData.heavyUsers.size,
    topOffenders,
    memoryUsage: {
      entries: rateLimitStore.size,
      estimatedMB: (rateLimitStore.size * 0.001).toFixed(2), // Rough estimate
    }
  }
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string) {
  rateLimitStore.delete(key)
}

/**
 * Clear all rate limit data
 */
export function clearAllRateLimits() {
  rateLimitStore.clear()
  monitoringData.totalRequests = 0
  monitoringData.blockedRequests = 0
  monitoringData.uniqueClients.clear()
  monitoringData.heavyUsers.clear()
}

/**
 * Express-style middleware wrapper
 */
export function withRateLimit(
  windowMs: number = 60000,
  maxRequests: number = 60,
  options: Partial<RateLimitConfig> = {}
) {
  const limiter = createRateLimiter({
    windowMs,
    maxRequests,
    ...options
  })
  
  return <T extends (...args: any[]) => any>(handler: T): T => {
    return (async (...args: Parameters<T>) => {
      const request = args[0] as NextRequest
      return limiter(request, () => handler(...args))
    }) as T
  }
}