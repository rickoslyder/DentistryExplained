/**
 * Cache Helper Utilities
 */

import crypto from 'crypto'
import { CacheItem } from '../types'

/**
 * Create a cache key from various inputs
 */
export function createCacheKey(...parts: (string | number | object)[]): string {
  const keyParts = parts.map(part => {
    if (typeof part === 'object') {
      // Sort object keys for consistent hashing
      return JSON.stringify(sortObject(part))
    }
    return String(part)
  })
  
  return keyParts.join(':')
}

/**
 * Create a hash-based cache key for long keys
 */
export function hashCacheKey(key: string): string {
  if (key.length <= 250) return key
  
  const hash = crypto.createHash('sha256').update(key).digest('hex')
  return `hash:${hash.substring(0, 32)}`
}

/**
 * Check if a cache item is expired
 */
export function isExpired(item: CacheItem): boolean {
  if (!item.expiresAt) return false
  return Date.now() > item.expiresAt
}

/**
 * Calculate expiration timestamp
 */
export function calculateExpiration(ttl: number): number {
  return Date.now() + (ttl * 1000)
}

/**
 * Sort object keys recursively for consistent serialization
 */
function sortObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return obj.toISOString()
  if (Array.isArray(obj)) return obj.map(sortObject)
  
  const sorted: any = {}
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortObject(obj[key])
  })
  
  return sorted
}

/**
 * Serialize value for storage
 */
export function serialize(value: any): string {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  
  try {
    return JSON.stringify(value)
  } catch (error) {
    throw new Error(`Failed to serialize value: ${error.message}`)
  }
}

/**
 * Deserialize value from storage
 */
export function deserialize<T>(value: string): T {
  if (value === 'undefined') return undefined as T
  if (value === 'null') return null as T
  
  try {
    return JSON.parse(value) as T
  } catch (error) {
    // If JSON parse fails, return as string
    return value as unknown as T
  }
}

/**
 * Match keys against a pattern (glob-style)
 */
export function matchPattern(pattern: string, key: string): boolean {
  // Convert glob pattern to regex
  const regex = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*/g, '.*') // * matches any sequence
    .replace(/\?/g, '.') // ? matches single char
    
  return new RegExp(`^${regex}$`).test(key)
}

/**
 * Compress data for storage (optional)
 */
export async function compress(data: string): Promise<Buffer> {
  const { gzip } = await import('zlib')
  const { promisify } = await import('util')
  const gzipAsync = promisify(gzip)
  
  return gzipAsync(Buffer.from(data, 'utf8'))
}

/**
 * Decompress data from storage
 */
export async function decompress(data: Buffer): Promise<string> {
  const { gunzip } = await import('zlib')
  const { promisify } = await import('util')
  const gunzipAsync = promisify(gunzip)
  
  const decompressed = await gunzipAsync(data)
  return decompressed.toString('utf8')
}

/**
 * Calculate memory size of a value (approximate)
 */
export function calculateSize(value: any): number {
  if (value === null || value === undefined) return 0
  
  switch (typeof value) {
    case 'boolean':
      return 4
    case 'number':
      return 8
    case 'string':
      return value.length * 2 // Unicode chars
    case 'object':
      if (value instanceof Date) return 8
      if (value instanceof Buffer) return value.length
      if (Array.isArray(value)) {
        return value.reduce((sum, item) => sum + calculateSize(item), 0)
      }
      // For objects, estimate based on JSON string
      try {
        return JSON.stringify(value).length * 2
      } catch {
        return 1024 // Default 1KB for non-serializable
      }
    default:
      return 0
  }
}

/**
 * Batch array into chunks
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Retry function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError!
}

/**
 * Circuit breaker for cache operations
 */
export class CircuitBreaker {
  private failures: number = 0
  private lastFailTime: number = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T | null> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'half-open'
      } else {
        return null
      }
    }

    try {
      const result = await fn()
      
      if (this.state === 'half-open') {
        this.state = 'closed'
        this.failures = 0
      }
      
      return result
    } catch (error) {
      this.failures++
      this.lastFailTime = Date.now()
      
      if (this.failures >= this.threshold) {
        this.state = 'open'
      }
      
      throw error
    }
  }

  isOpen(): boolean {
    return this.state === 'open'
  }

  reset(): void {
    this.failures = 0
    this.state = 'closed'
    this.lastFailTime = 0
  }
}