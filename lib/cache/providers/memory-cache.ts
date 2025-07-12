/**
 * In-Memory Cache Provider with LRU Eviction
 */

import { BaseCacheProvider } from '../base-provider'
import { MemoryConfig, CacheItem, CacheSerializationError } from '../types'
import { serialize, deserialize, calculateSize } from '../utils/helpers'

interface MemoryStoreItem {
  value: string
  size: number
  tags: string[]
  lastAccessed: number
  createdAt: number
  expiresAt?: number
}

type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'random'

export class MemoryCacheProvider extends BaseCacheProvider {
  name = 'memory'
  private store: Map<string, MemoryStoreItem> = new Map()
  private tagIndex: Map<string, Set<string>> = new Map()
  private accessCounts: Map<string, number> = new Map()
  private maxSize: number // bytes
  private currentSize: number = 0
  private evictionPolicy: EvictionPolicy
  private checkInterval?: NodeJS.Timeout

  constructor(config: MemoryConfig) {
    super(config.namespace, config.defaultTTL)
    this.maxSize = config.maxSize * 1024 * 1024 // Convert MB to bytes
    this.evictionPolicy = config.evictionPolicy || 'lru'

    // Start periodic cleanup
    const checkPeriod = (config.checkPeriod || 60) * 1000 // Convert to ms
    this.checkInterval = setInterval(() => {
      this.cleanup().catch(console.error)
    }, checkPeriod)
  }

  protected async _get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key)
    
    if (!item) {
      return null
    }

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      await this._delete(key)
      return null
    }

    // Update access metadata
    item.lastAccessed = Date.now()
    this.accessCounts.set(key, (this.accessCounts.get(key) || 0) + 1)

    try {
      return deserialize<T>(item.value)
    } catch (error) {
      throw new CacheSerializationError(
        `Failed to deserialize value for key ${key}`,
        this.name
      )
    }
  }

  protected async _set<T>(key: string, value: T, ttl?: number): Promise<void> {
    let serialized: string
    let size: number

    try {
      serialized = serialize(value)
      size = calculateSize(serialized)
    } catch (error) {
      throw new CacheSerializationError(
        `Failed to serialize value for key ${key}`,
        this.name
      )
    }

    // Check if value is too large
    if (size > this.maxSize) {
      throw new Error(`Value size (${size} bytes) exceeds cache limit (${this.maxSize} bytes)`)
    }

    // Evict items if necessary
    while (this.currentSize + size > this.maxSize) {
      const evicted = await this.evictOne()
      if (!evicted) break // No more items to evict
    }

    const now = Date.now()
    const item: MemoryStoreItem = {
      value: serialized,
      size,
      tags: [],
      lastAccessed: now,
      createdAt: now,
      expiresAt: ttl ? now + (ttl * 1000) : undefined
    }

    // Update size tracking
    const existingItem = this.store.get(key)
    if (existingItem) {
      this.currentSize -= existingItem.size
    }

    this.store.set(key, item)
    this.currentSize += size
    this.accessCounts.set(key, 1)
  }

  protected async _delete(key: string): Promise<boolean> {
    const item = this.store.get(key)
    
    if (!item) {
      return false
    }

    // Remove from store
    this.store.delete(key)
    this.currentSize -= item.size
    this.accessCounts.delete(key)

    // Remove from tag index
    for (const tag of item.tags) {
      const keys = this.tagIndex.get(tag)
      if (keys) {
        keys.delete(key)
        if (keys.size === 0) {
          this.tagIndex.delete(tag)
        }
      }
    }

    return true
  }

  protected async _exists(key: string): Promise<boolean> {
    const item = this.store.get(key)
    
    if (!item) {
      return false
    }

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      await this._delete(key)
      return false
    }

    return true
  }

  protected async _clear(): Promise<void> {
    this.store.clear()
    this.tagIndex.clear()
    this.accessCounts.clear()
    this.currentSize = 0
  }

  protected async _size(): Promise<number> {
    return this.store.size
  }

  protected async _keys(pattern?: string): Promise<string[]> {
    const keys: string[] = []
    
    for (const [key, item] of this.store.entries()) {
      // Skip expired items
      if (item.expiresAt && Date.now() > item.expiresAt) {
        continue
      }

      if (!pattern || key.includes(pattern)) {
        keys.push(key)
      }
    }

    return keys
  }

  protected async _ttl(key: string): Promise<number> {
    const item = this.store.get(key)
    
    if (!item || !item.expiresAt) {
      return -1
    }

    const remainingTtl = Math.floor((item.expiresAt - Date.now()) / 1000)
    return remainingTtl > 0 ? remainingTtl : -1
  }

  protected async _expire(key: string, seconds: number): Promise<boolean> {
    const item = this.store.get(key)
    
    if (!item) {
      return false
    }

    item.expiresAt = Date.now() + (seconds * 1000)
    return true
  }

  // Override tag operations for better performance
  protected async setTags(key: string, tags: string[]): Promise<void> {
    const item = this.store.get(key)
    if (!item) return

    // Remove old tags
    for (const oldTag of item.tags) {
      const keys = this.tagIndex.get(oldTag)
      if (keys) {
        keys.delete(key)
        if (keys.size === 0) {
          this.tagIndex.delete(oldTag)
        }
      }
    }

    // Add new tags
    item.tags = tags
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set())
      }
      this.tagIndex.get(tag)!.add(key)
    }
  }

  protected async getTags(key: string): Promise<string[]> {
    const item = this.store.get(key)
    return item?.tags || []
  }

  async taggedGet(tags: string[]): Promise<CacheItem[]> {
    const matchingKeys = new Set<string>()

    // Find all keys with matching tags
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag)
      if (keys) {
        keys.forEach(key => matchingKeys.add(key))
      }
    }

    const items: CacheItem[] = []
    
    for (const key of matchingKeys) {
      const item = this.store.get(key)
      if (item && (!item.expiresAt || Date.now() <= item.expiresAt)) {
        try {
          const value = deserialize(item.value)
          items.push({
            key,
            value,
            tags: item.tags,
            createdAt: item.createdAt,
            expiresAt: item.expiresAt
          })
        } catch (error) {
          console.warn(`Failed to deserialize cached item ${key}:`, error)
        }
      }
    }

    return items
  }

  async taggedDelete(tags: string[]): Promise<number> {
    const matchingKeys = new Set<string>()

    // Find all keys with matching tags
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag)
      if (keys) {
        keys.forEach(key => matchingKeys.add(key))
      }
    }

    let deleted = 0
    
    for (const key of matchingKeys) {
      if (await this._delete(key)) {
        deleted++
      }
    }

    return deleted
  }

  /**
   * Evict one item based on eviction policy
   */
  private async evictOne(): Promise<boolean> {
    if (this.store.size === 0) {
      return false
    }

    let keyToEvict: string | null = null

    switch (this.evictionPolicy) {
      case 'lru':
        // Least Recently Used
        let oldestAccess = Infinity
        for (const [key, item] of this.store.entries()) {
          if (item.lastAccessed < oldestAccess) {
            oldestAccess = item.lastAccessed
            keyToEvict = key
          }
        }
        break

      case 'lfu':
        // Least Frequently Used
        let minCount = Infinity
        for (const [key] of this.store.entries()) {
          const count = this.accessCounts.get(key) || 0
          if (count < minCount) {
            minCount = count
            keyToEvict = key
          }
        }
        break

      case 'fifo':
        // First In First Out
        let oldestCreated = Infinity
        for (const [key, item] of this.store.entries()) {
          if (item.createdAt < oldestCreated) {
            oldestCreated = item.createdAt
            keyToEvict = key
          }
        }
        break

      case 'random':
        // Random eviction
        const keys = Array.from(this.store.keys())
        keyToEvict = keys[Math.floor(Math.random() * keys.length)]
        break
    }

    if (keyToEvict) {
      await this._delete(keyToEvict)
      await this.emit('evict', { key: keyToEvict, reason: this.evictionPolicy })
      return true
    }

    return false
  }

  /**
   * Clean up expired items
   */
  private async cleanup(): Promise<void> {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      await this._delete(key)
    }
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): {
    currentSize: number
    maxSize: number
    utilization: number
    itemCount: number
    avgItemSize: number
  } {
    const itemCount = this.store.size
    const avgItemSize = itemCount > 0 ? this.currentSize / itemCount : 0

    return {
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      utilization: (this.currentSize / this.maxSize) * 100,
      itemCount,
      avgItemSize
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
    this.store.clear()
    this.tagIndex.clear()
    this.accessCounts.clear()
  }
}