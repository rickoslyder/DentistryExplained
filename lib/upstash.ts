import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Initialize Redis client
export const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Export rate limiter factory
export function createRateLimiter(
  identifier: string,
  requests: number = 10,
  window: '1s' | '10s' | '1m' | '10m' | '1h' | '1d' = '1m'
) {
  if (!redis) {
    // Return a mock rate limiter that always allows requests
    return {
      limit: async () => ({
        success: true,
        limit: requests,
        remaining: requests,
        reset: Date.now() + 60000,
      }),
    }
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `ratelimit:${identifier}:`,
  })
}