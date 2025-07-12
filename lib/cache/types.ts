/**
 * Cache System Types and Interfaces
 */

export interface CacheConfig {
  provider: 'redis' | 'cloudflare' | 'memory' | 'hybrid'
  defaultTTL: number // seconds
  maxSize?: number // MB for memory cache
  namespace?: string // for key prefixing
  compression?: boolean
  encryption?: boolean
}

export interface CacheItem<T = any> {
  key: string
  value: T
  ttl?: number // seconds
  tags?: string[]
  metadata?: Record<string, any>
  createdAt: number
  expiresAt?: number
}

export interface CacheProvider {
  name: string
  
  // Basic operations
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void>
  delete(key: string): Promise<boolean>
  exists(key: string): Promise<boolean>
  
  // Batch operations
  mget<T>(keys: string[]): Promise<(T | null)[]>
  mset(items: Array<{ key: string; value: any; options?: CacheSetOptions }>): Promise<void>
  mdelete(keys: string[]): Promise<number>
  
  // Advanced operations
  clear(): Promise<void>
  size(): Promise<number>
  keys(pattern?: string): Promise<string[]>
  
  // TTL operations
  ttl(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<boolean>
  persist(key: string): Promise<boolean>
  
  // Tag operations
  taggedGet(tags: string[]): Promise<CacheItem[]>
  taggedDelete(tags: string[]): Promise<number>
  
  // Health check
  isHealthy(): Promise<boolean>
  stats(): Promise<CacheStats>
}

export interface CacheSetOptions {
  ttl?: number // seconds
  tags?: string[]
  ifNotExists?: boolean
  ifExists?: boolean
  metadata?: Record<string, any>
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  size: number
  hitRate: number
  avgResponseTime: number
  errors: number
  lastError?: string
  uptime: number
}

export interface CacheInvalidationRule {
  id: string
  name: string
  pattern?: string // key pattern
  tags?: string[]
  schedule?: string // cron expression
  cascade?: boolean
  callback?: (keys: string[]) => Promise<void>
}

export interface CacheWarmingStrategy {
  id: string
  name: string
  keys?: string[]
  pattern?: string
  dataFetcher: (key: string) => Promise<any>
  schedule?: string // cron expression
  priority: number
  batchSize: number
}

export type CacheEvent = 
  | 'hit'
  | 'miss'
  | 'set'
  | 'delete'
  | 'expire'
  | 'evict'
  | 'error'
  | 'invalidate'

export interface CacheEventHandler {
  event: CacheEvent
  handler: (data: any) => void | Promise<void>
}

export interface CacheMonitor {
  recordHit(key: string, responseTime: number): void
  recordMiss(key: string, responseTime: number): void
  recordSet(key: string, size: number, responseTime: number): void
  recordDelete(key: string, responseTime: number): void
  recordError(error: Error, operation: string): void
  getStats(): CacheStats
  reset(): void
}

// Redis-specific config
export interface RedisConfig extends CacheConfig {
  provider: 'redis'
  url: string
  password?: string
  db?: number
  keyPrefix?: string
  enableOfflineQueue?: boolean
  maxRetriesPerRequest?: number
  enableReadyCheck?: boolean
  lazyConnect?: boolean
}

// Cloudflare KV specific config
export interface CloudflareKVConfig extends CacheConfig {
  provider: 'cloudflare'
  accountId: string
  namespaceId: string
  apiToken: string
  apiUrl?: string
}

// Memory cache specific config
export interface MemoryConfig extends CacheConfig {
  provider: 'memory'
  maxSize: number // MB
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'random'
  checkPeriod?: number // seconds
}

// Hybrid cache config
export interface HybridConfig extends CacheConfig {
  provider: 'hybrid'
  layers: Array<{
    provider: CacheProvider
    priority: number
    readThrough: boolean
    writeThrough: boolean
  }>
  fallbackBehavior: 'next' | 'error'
}

// Cache decorators
export interface CacheableOptions {
  key?: string | ((args: any[]) => string)
  ttl?: number
  tags?: string[]
  condition?: (args: any[], result: any) => boolean
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

export interface CacheEvictOptions {
  key?: string | ((args: any[]) => string)
  tags?: string[]
  pattern?: string
  cascade?: boolean
}

// Error types
export class CacheError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: string,
    public operation?: string
  ) {
    super(message)
    this.name = 'CacheError'
  }
}

export class CacheConnectionError extends CacheError {
  constructor(message: string, provider: string) {
    super(message, 'CONNECTION_ERROR', provider)
  }
}

export class CacheTimeoutError extends CacheError {
  constructor(message: string, provider: string, operation: string) {
    super(message, 'TIMEOUT_ERROR', provider, operation)
  }
}

export class CacheSerializationError extends CacheError {
  constructor(message: string, provider: string) {
    super(message, 'SERIALIZATION_ERROR', provider)
  }
}