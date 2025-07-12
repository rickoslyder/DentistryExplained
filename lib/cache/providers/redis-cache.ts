/**
 * Redis Cache Provider using Upstash
 */

import { Redis } from '@upstash/redis'
import { BaseCacheProvider } from '../base-provider'
import { 
  RedisConfig, 
  CacheItem, 
  CacheConnectionError,
  CacheTimeoutError,
  CacheSerializationError 
} from '../types'
import { 
  serialize, 
  deserialize, 
  calculateSize,
  chunk,
  retry,
  CircuitBreaker
} from '../utils/helpers'

interface RedisMetadata {
  tags?: string[]
  size?: number
  createdAt?: number
}

export class RedisCacheProvider extends BaseCacheProvider {
  name = 'redis'
  private redis: Redis
  private circuitBreaker: CircuitBreaker
  private pipeline: any[] = []
  private pipelineTimeout?: NodeJS.Timeout
  private readonly keyPrefix: string
  private readonly maxRetries: number
  private readonly enableOfflineQueue: boolean

  constructor(config: RedisConfig) {
    super(config.namespace, config.defaultTTL)
    
    this.keyPrefix = config.keyPrefix || 'cache'
    this.maxRetries = config.maxRetriesPerRequest || 3
    this.enableOfflineQueue = config.enableOfflineQueue ?? true

    // Initialize Redis client
    try {
      this.redis = new Redis({
        url: config.url,
        token: config.password!,
      })
    } catch (error) {
      throw new CacheConnectionError(
        `Failed to initialize Redis client: ${error.message}`,
        this.name
      )
    }

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker(5, 60000)

    // Test connection
    this.testConnection().catch(error => {
      console.error('Redis connection test failed:', error)
    })
  }

  private async testConnection(): Promise<void> {
    try {
      await this.redis.ping()
    } catch (error) {
      throw new CacheConnectionError(
        `Redis connection failed: ${error.message}`,
        this.name
      )
    }
  }

  protected async _get<T>(key: string): Promise<T | null> {
    return this.circuitBreaker.execute(async () => {
      try {
        const [value, metadata] = await Promise.all([
          this.redis.get(key),
          this.redis.hgetall(`${key}:meta`)
        ])

        if (value === null) {
          return null
        }

        return deserialize<T>(value as string)
      } catch (error) {
        if (error.message?.includes('timeout')) {
          throw new CacheTimeoutError(
            `Redis get timeout for key ${key}`,
            this.name,
            'get'
          )
        }
        throw error
      }
    })
  }

  protected async _set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      try {
        const serialized = serialize(value)
        const size = calculateSize(serialized)
        const effectiveTtl = ttl || this.defaultTTL

        // Use pipeline for atomic operations
        const pipe = this.redis.pipeline()
        
        // Set the value with TTL
        if (effectiveTtl > 0) {
          pipe.setex(key, effectiveTtl, serialized)
        } else {
          pipe.set(key, serialized)
        }

        // Set metadata
        pipe.hset(`${key}:meta`, {
          size: size.toString(),
          createdAt: Date.now().toString()
        })
        
        if (effectiveTtl > 0) {
          pipe.expire(`${key}:meta`, effectiveTtl)
        }

        await pipe.exec()
      } catch (error) {
        if (error.message?.includes('timeout')) {
          throw new CacheTimeoutError(
            `Redis set timeout for key ${key}`,
            this.name,
            'set'
          )
        }
        if (error.message?.includes('serialize')) {
          throw new CacheSerializationError(
            `Failed to serialize value for key ${key}`,
            this.name
          )
        }
        throw error
      }
    })
  }

  protected async _delete(key: string): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      try {
        const pipe = this.redis.pipeline()
        pipe.del(key)
        pipe.del(`${key}:meta`)
        pipe.del(`${key}:tags`)
        
        const results = await pipe.exec()
        return results[0] === 1
      } catch (error) {
        if (error.message?.includes('timeout')) {
          throw new CacheTimeoutError(
            `Redis delete timeout for key ${key}`,
            this.name,
            'delete'
          )
        }
        throw error
      }
    })
  }

  protected async _exists(key: string): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      try {
        const exists = await this.redis.exists(key)
        return exists === 1
      } catch (error) {
        if (error.message?.includes('timeout')) {
          throw new CacheTimeoutError(
            `Redis exists timeout for key ${key}`,
            this.name,
            'exists'
          )
        }
        throw error
      }
    })
  }

  protected async _clear(): Promise<void> {
    return this.circuitBreaker.execute(async () => {
      try {
        // Get all keys with our prefix
        const pattern = this.namespace 
          ? `${this.keyPrefix}:${this.namespace}:*`
          : `${this.keyPrefix}:*`
        
        let cursor = 0
        const keysToDelete: string[] = []

        // Scan in batches
        do {
          const [newCursor, keys] = await this.redis.scan(cursor, {
            match: pattern,
            count: 1000
          })
          
          cursor = newCursor
          keysToDelete.push(...keys)
        } while (cursor !== 0)

        // Delete in batches
        if (keysToDelete.length > 0) {
          const batches = chunk(keysToDelete, 1000)
          for (const batch of batches) {
            await this.redis.del(...batch)
          }
        }
      } catch (error) {
        if (error.message?.includes('timeout')) {
          throw new CacheTimeoutError(
            'Redis clear timeout',
            this.name,
            'clear'
          )
        }
        throw error
      }
    })
  }

  protected async _size(): Promise<number> {
    return this.circuitBreaker.execute(async () => {
      try {
        const info = await this.redis.dbsize()
        return info
      } catch (error) {
        if (error.message?.includes('timeout')) {
          throw new CacheTimeoutError(
            'Redis size timeout',
            this.name,
            'size'
          )
        }
        throw error
      }
    })
  }

  protected async _keys(pattern?: string): Promise<string[]> {
    return this.circuitBreaker.execute(async () => {
      try {
        const searchPattern = pattern 
          ? `${this.getFullKey(pattern)}*`
          : `${this.keyPrefix}:*`
        
        const keys: string[] = []
        let cursor = 0

        do {
          const [newCursor, batch] = await this.redis.scan(cursor, {
            match: searchPattern,
            count: 1000
          })
          
          cursor = newCursor
          keys.push(...batch)
        } while (cursor !== 0)

        return keys
      } catch (error) {
        if (error.message?.includes('timeout')) {
          throw new CacheTimeoutError(
            'Redis keys timeout',
            this.name,
            'keys'
          )
        }
        throw error
      }
    })
  }

  protected async _ttl(key: string): Promise<number> {
    return this.circuitBreaker.execute(async () => {
      try {
        const ttl = await this.redis.ttl(key)
        return ttl
      } catch (error) {
        if (error.message?.includes('timeout')) {
          throw new CacheTimeoutError(
            `Redis ttl timeout for key ${key}`,
            this.name,
            'ttl'
          )
        }
        throw error
      }
    })
  }

  protected async _expire(key: string, seconds: number): Promise<boolean> {
    return this.circuitBreaker.execute(async () => {
      try {
        const result = await this.redis.expire(key, seconds)
        
        // Also update metadata expiration
        await this.redis.expire(`${key}:meta`, seconds)
        await this.redis.expire(`${key}:tags`, seconds)
        
        return result === 1
      } catch (error) {
        if (error.message?.includes('timeout')) {
          throw new CacheTimeoutError(
            `Redis expire timeout for key ${key}`,
            this.name,
            'expire'
          )
        }
        throw error
      }
    })
  }

  // Override batch operations for better performance
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return []

    return this.circuitBreaker.execute(async () => {
      try {
        const fullKeys = keys.map(key => this.getFullKey(key))
        const values = await this.redis.mget(...fullKeys)
        
        return values.map((value, index) => {
          if (value === null) {
            this.monitor.recordMiss(fullKeys[index], 0)
            return null
          }
          
          this.monitor.recordHit(fullKeys[index], 0)
          try {
            return deserialize<T>(value as string)
          } catch {
            return null
          }
        })
      } catch (error) {
        if (error.message?.includes('timeout')) {
          throw new CacheTimeoutError(
            'Redis mget timeout',
            this.name,
            'mget'
          )
        }
        throw error
      }
    })
  }

  async mset(items: Array<{ key: string; value: any; options?: any }>): Promise<void> {
    if (items.length === 0) return

    return this.circuitBreaker.execute(async () => {
      try {
        const pipe = this.redis.pipeline()
        
        for (const item of items) {
          const fullKey = this.getFullKey(item.key)
          const serialized = serialize(item.value)
          const ttl = item.options?.ttl || this.defaultTTL
          
          if (ttl > 0) {
            pipe.setex(fullKey, ttl, serialized)
          } else {
            pipe.set(fullKey, serialized)
          }
          
          // Set metadata
          pipe.hset(`${fullKey}:meta`, {
            size: calculateSize(serialized).toString(),
            createdAt: Date.now().toString()
          })
          
          if (ttl > 0) {
            pipe.expire(`${fullKey}:meta`, ttl)
          }
        }
        
        await pipe.exec()
        
        // Record metrics
        for (const item of items) {
          const fullKey = this.getFullKey(item.key)
          this.monitor.recordSet(fullKey, calculateSize(item.value), 0)
        }
      } catch (error) {
        if (error.message?.includes('timeout')) {
          throw new CacheTimeoutError(
            'Redis mset timeout',
            this.name,
            'mset'
          )
        }
        throw error
      }
    })
  }

  // Tag operations
  protected async setTags(key: string, tags: string[]): Promise<void> {
    if (tags.length === 0) return

    const pipe = this.redis.pipeline()
    
    // Store tags for the key
    pipe.sadd(`${key}:tags`, ...tags)
    
    // Add key to tag indexes
    for (const tag of tags) {
      pipe.sadd(`tag:${tag}`, key)
    }
    
    // Set expiration on tag data
    const ttl = await this._ttl(key)
    if (ttl > 0) {
      pipe.expire(`${key}:tags`, ttl)
    }
    
    await pipe.exec()
  }

  protected async getTags(key: string): Promise<string[]> {
    const tags = await this.redis.smembers(`${key}:tags`)
    return tags
  }

  async taggedGet(tags: string[]): Promise<CacheItem[]> {
    if (tags.length === 0) return []

    return this.circuitBreaker.execute(async () => {
      try {
        // Get all keys for the tags
        const tagKeys = tags.map(tag => `tag:${tag}`)
        const keySets = await Promise.all(
          tagKeys.map(tagKey => this.redis.smembers(tagKey))
        )
        
        // Find intersection of all tag sets
        const allKeys = keySets.reduce((acc, keys) => {
          if (acc.length === 0) return keys
          return acc.filter(key => keys.includes(key))
        })
        
        if (allKeys.length === 0) return []
        
        // Get values for all matching keys
        const items: CacheItem[] = []
        
        for (const key of allKeys) {
          const value = await this._get(key)
          if (value !== null) {
            const metadata = await this.redis.hgetall(`${key}:meta`)
            const tags = await this.getTags(key)
            
            items.push({
              key: key.replace(`${this.keyPrefix}:`, ''),
              value,
              tags,
              createdAt: parseInt(metadata.createdAt || '0'),
              ttl: await this._ttl(key)
            })
          }
        }
        
        return items
      } catch (error) {
        if (error.message?.includes('timeout')) {
          throw new CacheTimeoutError(
            'Redis taggedGet timeout',
            this.name,
            'taggedGet'
          )
        }
        throw error
      }
    })
  }

  async taggedDelete(tags: string[]): Promise<number> {
    const items = await this.taggedGet(tags)
    const results = await Promise.all(
      items.map(item => this.delete(item.key))
    )
    return results.filter(Boolean).length
  }

  // Helper to build full key with prefix and namespace
  protected getFullKey(key: string): string {
    const parts = [this.keyPrefix]
    if (this.namespace) parts.push(this.namespace)
    parts.push(key)
    return parts.join(':')
  }

  // Optimized pipeline operations
  async addToPipeline(operation: () => Promise<void>): Promise<void> {
    this.pipeline.push(operation)
    
    // Execute pipeline if it reaches threshold or after timeout
    if (this.pipeline.length >= 100) {
      await this.executePipeline()
    } else if (!this.pipelineTimeout) {
      this.pipelineTimeout = setTimeout(() => {
        this.executePipeline().catch(console.error)
      }, 10)
    }
  }

  private async executePipeline(): Promise<void> {
    if (this.pipeline.length === 0) return
    
    const operations = [...this.pipeline]
    this.pipeline = []
    
    if (this.pipelineTimeout) {
      clearTimeout(this.pipelineTimeout)
      this.pipelineTimeout = undefined
    }
    
    await Promise.all(operations.map(op => op()))
  }

  // Cleanup
  async destroy(): Promise<void> {
    await this.executePipeline()
    this.circuitBreaker.reset()
  }
}