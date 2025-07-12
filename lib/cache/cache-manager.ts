/**
 * Unified Cache Manager
 * 
 * Provides a single interface to manage multiple cache providers
 * with automatic fallback and layer management
 */

import { 
  CacheProvider, 
  CacheConfig, 
  CacheSetOptions,
  CacheStats,
  CacheItem,
  HybridConfig,
  RedisConfig,
  MemoryConfig,
  CloudflareKVConfig,
  CacheError
} from './types'
import { getSettings } from '@/lib/settings'
import { RedisCacheProvider } from './providers/redis-cache'
import { MemoryCacheProvider } from './providers/memory-cache'
import { CloudflareKVProvider } from './providers/cloudflare-kv'

export class CacheManager {
  private static instance: CacheManager | null = null
  private providers: Map<string, CacheProvider> = new Map()
  private primaryProvider: CacheProvider | null = null
  private fallbackProviders: CacheProvider[] = []
  private initialized: boolean = false

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  /**
   * Initialize cache system from settings
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const settings = await getSettings()
      
      // Get cache configuration from settings
      // For now, use defaults since cache_config isn't in the settings interface yet
      const cacheConfig = {
        provider: 'hybrid',
        defaultTTL: 3600,
        layers: [
          {
            type: 'memory',
            priority: 1,
            readThrough: true,
            writeThrough: true,
            config: {
              maxSize: 100, // 100MB
              evictionPolicy: 'lru'
            }
          },
          {
            type: 'redis',
            priority: 2,
            readThrough: true,
            writeThrough: true,
            config: {
              url: process.env.UPSTASH_REDIS_REST_URL,
              token: process.env.UPSTASH_REDIS_REST_TOKEN
            }
          }
        ]
      }

      await this.setupProviders(cacheConfig)
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize cache manager:', error)
      // Fall back to memory-only cache
      await this.setupMemoryOnlyCache()
      this.initialized = true
    }
  }

  /**
   * Set up cache providers based on configuration
   */
  private async setupProviders(config: any): Promise<void> {
    const providers: CacheProvider[] = []

    // Set up each layer
    for (const layer of config.layers || []) {
      try {
        const provider = await this.createProvider(layer.type, layer.config)
        if (provider) {
          providers.push(provider)
          this.providers.set(layer.type, provider)
        }
      } catch (error) {
        console.warn(`Failed to create ${layer.type} provider:`, error)
      }
    }

    // Set primary and fallback providers based on priority
    if (providers.length > 0) {
      providers.sort((a, b) => {
        const aPriority = config.layers.find((l: any) => l.type === a.name)?.priority || 999
        const bPriority = config.layers.find((l: any) => l.type === b.name)?.priority || 999
        return aPriority - bPriority
      })

      this.primaryProvider = providers[0]
      this.fallbackProviders = providers.slice(1)
    } else {
      // No providers configured, use memory cache
      await this.setupMemoryOnlyCache()
    }
  }

  /**
   * Create a cache provider instance
   */
  private async createProvider(type: string, config: any): Promise<CacheProvider | null> {
    switch (type) {
      case 'memory':
        return new MemoryCacheProvider({
          provider: 'memory',
          maxSize: config.maxSize || 100,
          evictionPolicy: config.evictionPolicy || 'lru',
          defaultTTL: config.defaultTTL || 3600
        })

      case 'redis':
        if (!config.url || !config.token) {
          console.warn('Redis configuration missing')
          return null
        }
        
        return new RedisCacheProvider({
          provider: 'redis',
          url: config.url,
          password: config.token,
          defaultTTL: config.defaultTTL || 3600,
          keyPrefix: config.keyPrefix || 'dentistry'
        })

      case 'cloudflare':
        if (!config.accountId || !config.namespaceId || !config.apiToken) {
          console.warn('Cloudflare KV configuration missing')
          return null
        }
        
        return new CloudflareKVProvider({
          provider: 'cloudflare',
          accountId: config.accountId,
          namespaceId: config.namespaceId,
          apiToken: config.apiToken,
          defaultTTL: config.defaultTTL || 3600
        })

      default:
        console.warn(`Unknown cache provider type: ${type}`)
        return null
    }
  }

  /**
   * Set up memory-only cache as fallback
   */
  private async setupMemoryOnlyCache(): Promise<void> {
    const memoryProvider = new MemoryCacheProvider({
      provider: 'memory',
      maxSize: 50, // 50MB for fallback
      evictionPolicy: 'lru',
      defaultTTL: 3600
    })

    this.primaryProvider = memoryProvider
    this.providers.set('memory', memoryProvider)
    this.fallbackProviders = []
  }

  /**
   * Get value from cache with automatic fallback
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.initialized) await this.initialize()
    if (!this.primaryProvider) return null

    try {
      // Try primary provider first
      const value = await this.primaryProvider.get<T>(key)
      if (value !== null) return value

      // Try fallback providers
      for (const provider of this.fallbackProviders) {
        try {
          const fallbackValue = await provider.get<T>(key)
          if (fallbackValue !== null) {
            // Write-through to primary if found in fallback
            await this.primaryProvider.set(key, fallbackValue).catch(() => {})
            return fallbackValue
          }
        } catch (error) {
          console.warn(`Fallback provider ${provider.name} failed:`, error)
        }
      }

      return null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  /**
   * Set value in cache with write-through to all layers
   */
  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    if (!this.initialized) await this.initialize()
    if (!this.primaryProvider) return

    const promises: Promise<void>[] = []

    // Write to primary
    promises.push(this.primaryProvider.set(key, value, options))

    // Write-through to fallback providers
    for (const provider of this.fallbackProviders) {
      promises.push(
        provider.set(key, value, options).catch(error => {
          console.warn(`Write-through to ${provider.name} failed:`, error)
        })
      )
    }

    await Promise.all(promises)
  }

  /**
   * Delete key from all cache layers
   */
  async delete(key: string): Promise<boolean> {
    if (!this.initialized) await this.initialize()
    if (!this.primaryProvider) return false

    const promises: Promise<boolean>[] = []

    // Delete from all providers
    for (const provider of [this.primaryProvider, ...this.fallbackProviders]) {
      promises.push(
        provider.delete(key).catch(() => false)
      )
    }

    const results = await Promise.all(promises)
    return results.some(r => r)
  }

  /**
   * Clear all cache layers
   */
  async clear(): Promise<void> {
    if (!this.initialized) await this.initialize()

    const promises: Promise<void>[] = []

    for (const provider of this.providers.values()) {
      promises.push(
        provider.clear().catch(error => {
          console.warn(`Clear failed for ${provider.name}:`, error)
        })
      )
    }

    await Promise.all(promises)
  }

  /**
   * Get cache statistics from all providers
   */
  async stats(): Promise<Record<string, CacheStats>> {
    if (!this.initialized) await this.initialize()

    const stats: Record<string, CacheStats> = {}

    for (const [name, provider] of this.providers.entries()) {
      try {
        stats[name] = await provider.stats()
      } catch (error) {
        console.warn(`Failed to get stats for ${name}:`, error)
      }
    }

    return stats
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    if (!this.initialized) await this.initialize()

    let totalDeleted = 0

    for (const provider of this.providers.values()) {
      try {
        const deleted = await provider.taggedDelete(tags)
        totalDeleted += deleted
      } catch (error) {
        console.warn(`Tag invalidation failed for ${provider.name}:`, error)
      }
    }

    return totalDeleted
  }

  /**
   * Warm cache with data
   */
  async warm(
    items: Array<{ key: string; value: any; options?: CacheSetOptions }>
  ): Promise<void> {
    if (!this.initialized) await this.initialize()

    // Batch items for efficient warming
    const batchSize = 100
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      await Promise.all(
        batch.map(item => this.set(item.key, item.value, item.options))
      )
    }
  }

  /**
   * Get specific provider by name
   */
  getProvider(name: string): CacheProvider | undefined {
    return this.providers.get(name)
  }

  /**
   * Check if cache system is healthy
   */
  async isHealthy(): Promise<boolean> {
    if (!this.initialized) await this.initialize()
    if (!this.primaryProvider) return false

    try {
      return await this.primaryProvider.isHealthy()
    } catch {
      return false
    }
  }
}

// Export singleton instance getter
export const cacheManager = CacheManager.getInstance()

// Cache decorators for methods
export function Cacheable(options?: CacheableOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = options?.key 
        ? typeof options.key === 'function' 
          ? options.key(args)
          : options.key
        : `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`

      // Try to get from cache
      const cached = await cacheManager.get(cacheKey)
      if (cached !== null) {
        return options?.deserialize ? options.deserialize(cached) : cached
      }

      // Execute method
      const result = await originalMethod.apply(this, args)

      // Check condition
      if (options?.condition && !options.condition(args, result)) {
        return result
      }

      // Cache the result
      const value = options?.serialize ? options.serialize(result) : result
      await cacheManager.set(cacheKey, value, {
        ttl: options?.ttl,
        tags: options?.tags
      })

      return result
    }

    return descriptor
  }
}

export function CacheEvict(options?: CacheEvictOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args)

      // Evict cache
      if (options?.key) {
        const cacheKey = typeof options.key === 'function' 
          ? options.key(args)
          : options.key
        await cacheManager.delete(cacheKey)
      }

      if (options?.tags) {
        await cacheManager.invalidateByTags(options.tags)
      }

      if (options?.pattern) {
        // Pattern-based eviction would need to be implemented
        console.warn('Pattern-based eviction not yet implemented')
      }

      return result
    }

    return descriptor
  }
}

interface CacheableOptions {
  key?: string | ((args: any[]) => string)
  ttl?: number
  tags?: string[]
  condition?: (args: any[], result: any) => boolean
  serialize?: (value: any) => any
  deserialize?: (value: any) => any
}

interface CacheEvictOptions {
  key?: string | ((args: any[]) => string)
  tags?: string[]
  pattern?: string
  cascade?: boolean
}