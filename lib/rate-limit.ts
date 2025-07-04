import { NextRequest } from 'next/server'
import { RateLimitError } from './errors'

// Simple in-memory rate limiter for development
// In production, use Redis or Upstash for distributed rate limiting
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  async limit(identifier: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Get existing requests for this identifier
    let timestamps = this.requests.get(identifier) || []
    
    // Remove old requests outside the window
    timestamps = timestamps.filter(timestamp => timestamp > windowStart)
    
    // Check if limit exceeded
    if (timestamps.length >= this.maxRequests) {
      const oldestTimestamp = Math.min(...timestamps)
      const reset = oldestTimestamp + this.windowMs
      
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset
      }
    }
    
    // Add current request
    timestamps.push(now)
    this.requests.set(identifier, timestamps)
    
    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup()
    }
    
    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - timestamps.length,
      reset: now + this.windowMs
    }
  }

  private cleanup() {
    const now = Date.now()
    const windowStart = now - this.windowMs
    
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(t => t > windowStart)
      if (validTimestamps.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validTimestamps)
      }
    }
  }
}

// Rate limiter instances for different endpoints
const rateLimiters = {
  api: new InMemoryRateLimiter(60000, 60), // 60 requests per minute
  auth: new InMemoryRateLimiter(60000, 10), // 10 requests per minute
  ai: new InMemoryRateLimiter(60000, 20), // 20 requests per minute
}

export async function rateLimit(
  request: NextRequest,
  type: 'api' | 'auth' | 'ai' = 'api'
): Promise<void> {
  // Get identifier (IP address or user ID)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'anonymous'
  
  // Get the appropriate rate limiter
  const limiter = rateLimiters[type]
  
  // Check rate limit
  const { success, limit, remaining, reset } = await limiter.limit(ip)
  
  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)
    throw new RateLimitError(retryAfter)
  }
}

// Middleware for API routes
export async function withRateLimit(
  handler: (request: NextRequest) => Promise<Response>,
  type: 'api' | 'auth' | 'ai' = 'api'
) {
  return async (request: NextRequest) => {
    try {
      await rateLimit(request, type)
      return await handler(request)
    } catch (error) {
      if (error instanceof RateLimitError) {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Too many requests',
              code: 'RATE_LIMIT_EXCEEDED',
              retryAfter: error.details?.retryAfter
            }
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(error.details?.retryAfter || 60)
            }
          }
        )
      }
      throw error
    }
  }
}