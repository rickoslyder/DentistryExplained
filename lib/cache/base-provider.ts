/**
 * Base Cache Provider Abstract Class
 */

import { 
  CacheProvider, 
  CacheSetOptions, 
  CacheStats, 
  CacheItem,
  CacheMonitor,
  CacheEvent,
  CacheEventHandler,
  CacheError
} from './types'
import { CacheMonitorImpl } from './utils/monitor'
import { createCacheKey, isExpired } from './utils/helpers'

export abstract class BaseCacheProvider implements CacheProvider {
  abstract name: string
  protected monitor: CacheMonitor
  protected eventHandlers: Map<CacheEvent, CacheEventHandler[]> = new Map()
  protected namespace?: string
  protected defaultTTL: number

  constructor(namespace?: string, defaultTTL: number = 3600) {
    this.monitor = new CacheMonitorImpl()
    this.namespace = namespace
    this.defaultTTL = defaultTTL
  }

  // Abstract methods that must be implemented by providers
  protected abstract _get<T>(key: string): Promise<T | null>
  protected abstract _set<T>(key: string, value: T, ttl?: number): Promise<void>
  protected abstract _delete(key: string): Promise<boolean>
  protected abstract _exists(key: string): Promise<boolean>
  protected abstract _clear(): Promise<void>
  protected abstract _size(): Promise<number>
  protected abstract _keys(pattern?: string): Promise<string[]>
  protected abstract _ttl(key: string): Promise<number>
  protected abstract _expire(key: string, seconds: number): Promise<boolean>
  
  // Public methods with monitoring and error handling
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now()
    const fullKey = this.getFullKey(key)
    
    try {
      const value = await this._get<T>(fullKey)
      const responseTime = Date.now() - startTime
      
      if (value !== null) {
        this.monitor.recordHit(fullKey, responseTime)
        await this.emit('hit', { key: fullKey, responseTime })
      } else {
        this.monitor.recordMiss(fullKey, responseTime)
        await this.emit('miss', { key: fullKey, responseTime })
      }
      
      return value
    } catch (error) {
      this.handleError(error as Error, 'get')
      return null
    }
  }

  async set<T>(key: string, value: T, options?: CacheSetOptions): Promise<void> {
    const startTime = Date.now()
    const fullKey = this.getFullKey(key)
    const ttl = options?.ttl ?? this.defaultTTL
    
    try {
      // Check conditions
      if (options?.ifNotExists && await this._exists(fullKey)) {
        return
      }
      if (options?.ifExists && !await this._exists(fullKey)) {
        return
      }
      
      await this._set(fullKey, value, ttl)
      
      // Handle tags if supported
      if (options?.tags && options.tags.length > 0) {
        await this.setTags(fullKey, options.tags)
      }
      
      const responseTime = Date.now() - startTime
      const size = this.estimateSize(value)
      
      this.monitor.recordSet(fullKey, size, responseTime)
      await this.emit('set', { key: fullKey, size, responseTime, ttl })
    } catch (error) {
      this.handleError(error as Error, 'set')
      throw error
    }
  }

  async delete(key: string): Promise<boolean> {
    const startTime = Date.now()
    const fullKey = this.getFullKey(key)
    
    try {
      const result = await this._delete(fullKey)
      const responseTime = Date.now() - startTime
      
      if (result) {
        this.monitor.recordDelete(fullKey, responseTime)
        await this.emit('delete', { key: fullKey, responseTime })
      }
      
      return result
    } catch (error) {
      this.handleError(error as Error, 'delete')
      return false
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key)
    
    try {
      return await this._exists(fullKey)
    } catch (error) {
      this.handleError(error as Error, 'exists')
      return false
    }
  }

  // Batch operations with default implementations
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    return Promise.all(keys.map(key => this.get<T>(key)))
  }

  async mset(items: Array<{ key: string; value: any; options?: CacheSetOptions }>): Promise<void> {
    await Promise.all(
      items.map(item => this.set(item.key, item.value, item.options))
    )
  }

  async mdelete(keys: string[]): Promise<number> {
    const results = await Promise.all(keys.map(key => this.delete(key)))
    return results.filter(Boolean).length
  }

  // Advanced operations
  async clear(): Promise<void> {
    try {
      await this._clear()
      await this.emit('clear', {})
    } catch (error) {
      this.handleError(error as Error, 'clear')
      throw error
    }
  }

  async size(): Promise<number> {
    try {
      return await this._size()
    } catch (error) {
      this.handleError(error as Error, 'size')
      return 0
    }
  }

  async keys(pattern?: string): Promise<string[]> {
    try {
      const keys = await this._keys(pattern)
      return this.namespace 
        ? keys.map(key => key.replace(`${this.namespace}:`, ''))
        : keys
    } catch (error) {
      this.handleError(error as Error, 'keys')
      return []
    }
  }

  async ttl(key: string): Promise<number> {
    const fullKey = this.getFullKey(key)
    
    try {
      return await this._ttl(fullKey)
    } catch (error) {
      this.handleError(error as Error, 'ttl')
      return -1
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const fullKey = this.getFullKey(key)
    
    try {
      const result = await this._expire(fullKey, seconds)
      if (result) {
        await this.emit('expire', { key: fullKey, ttl: seconds })
      }
      return result
    } catch (error) {
      this.handleError(error as Error, 'expire')
      return false
    }
  }

  async persist(key: string): Promise<boolean> {
    // Remove expiration by setting a very long TTL
    return this.expire(key, 365 * 24 * 60 * 60) // 1 year
  }

  // Tag operations (default implementations)
  async taggedGet(tags: string[]): Promise<CacheItem[]> {
    // Default implementation - providers can override for better performance
    const allKeys = await this.keys()
    const items: CacheItem[] = []
    
    for (const key of allKeys) {
      const itemTags = await this.getTags(key)
      if (tags.some(tag => itemTags.includes(tag))) {
        const value = await this.get(key)
        if (value !== null) {
          items.push({
            key,
            value,
            tags: itemTags,
            createdAt: Date.now(),
          })
        }
      }
    }
    
    return items
  }

  async taggedDelete(tags: string[]): Promise<number> {
    const items = await this.taggedGet(tags)
    const results = await Promise.all(
      items.map(item => this.delete(item.key))
    )
    return results.filter(Boolean).length
  }

  // Health and stats
  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check - try to set and get a value
      const testKey = '__health_check__'
      await this.set(testKey, 'ok', { ttl: 10 })
      const value = await this.get(testKey)
      await this.delete(testKey)
      return value === 'ok'
    } catch {
      return false
    }
  }

  async stats(): Promise<CacheStats> {
    return this.monitor.getStats()
  }

  // Event handling
  on(event: CacheEvent, handler: (data: any) => void | Promise<void>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push({ event, handler })
  }

  off(event: CacheEvent, handler: (data: any) => void | Promise<void>): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.findIndex(h => h.handler === handler)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // Protected helper methods
  protected getFullKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key
  }

  protected async emit(event: CacheEvent, data: any): Promise<void> {
    const handlers = this.eventHandlers.get(event) || []
    await Promise.all(
      handlers.map(h => Promise.resolve(h.handler(data)))
    )
  }

  protected handleError(error: Error, operation: string): void {
    this.monitor.recordError(error, operation)
    this.emit('error', { error, operation }).catch(() => {})
  }

  protected estimateSize(value: any): number {
    // Simple size estimation
    const str = JSON.stringify(value)
    return Buffer.byteLength(str, 'utf8')
  }

  // Tag management helpers (override for provider-specific implementation)
  protected async setTags(key: string, tags: string[]): Promise<void> {
    // Default implementation - store tags as metadata
    // Providers can override for better performance
  }

  protected async getTags(key: string): Promise<string[]> {
    // Default implementation
    return []
  }
}