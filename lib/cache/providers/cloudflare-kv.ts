/**
 * Cloudflare KV Cache Provider
 * 
 * Provides edge caching using Cloudflare Workers KV
 */

import { BaseCacheProvider } from '../base-provider'
import { 
  CloudflareKVConfig, 
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
  retry
} from '../utils/helpers'

interface KVMetadata {
  tags?: string[]
  size?: number
  createdAt?: number
  expiresAt?: number
}

interface KVListResult {
  keys: Array<{
    name: string
    metadata?: KVMetadata
    expiration?: number
  }>
  list_complete: boolean
  cursor?: string
}

export class CloudflareKVProvider extends BaseCacheProvider {
  name = 'cloudflare'
  private readonly accountId: string
  private readonly namespaceId: string
  private readonly apiToken: string
  private readonly apiUrl: string
  private readonly headers: Record<string, string>

  constructor(config: CloudflareKVConfig) {
    super(config.namespace, config.defaultTTL)
    
    this.accountId = config.accountId
    this.namespaceId = config.namespaceId
    this.apiToken = config.apiToken
    this.apiUrl = config.apiUrl || 'https://api.cloudflare.com/client/v4'
    
    this.headers = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    }

    // Test connection
    this.testConnection().catch(error => {
      console.error('Cloudflare KV connection test failed:', error)
    })
  }

  private async testConnection(): Promise<void> {
    try {
      const response = await fetch(
        `${this.apiUrl}/accounts/${this.accountId}/storage/kv/namespaces/${this.namespaceId}`,
        { 
          method: 'GET',
          headers: this.headers 
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      throw new CacheConnectionError(
        `Cloudflare KV connection failed: ${error.message}`,
        this.name
      )
    }
  }

  private getKVUrl(key?: string): string {
    const base = `${this.apiUrl}/accounts/${this.accountId}/storage/kv/namespaces/${this.namespaceId}`
    return key ? `${base}/values/${encodeURIComponent(key)}` : `${base}/keys`
  }

  protected async _get<T>(key: string): Promise<T | null> {
    try {
      const response = await retry(() => 
        fetch(this.getKVUrl(key), {
          method: 'GET',
          headers: this.headers
        })
      )

      if (response.status === 404) {
        return null
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const text = await response.text()
      
      try {
        return deserialize<T>(text)
      } catch (error) {
        throw new CacheSerializationError(
          `Failed to deserialize value for key ${key}`,
          this.name
        )
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new CacheTimeoutError(
          `Cloudflare KV get timeout for key ${key}`,
          this.name,
          'get'
        )
      }
      throw error
    }
  }

  protected async _set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = serialize(value)
      const size = calculateSize(serialized)
      const effectiveTtl = ttl || this.defaultTTL

      const metadata: KVMetadata = {
        size,
        createdAt: Date.now(),
        expiresAt: effectiveTtl > 0 ? Date.now() + (effectiveTtl * 1000) : undefined
      }

      const body: any = {
        value: serialized,
        metadata
      }

      // Cloudflare KV uses seconds for expiration
      if (effectiveTtl > 0) {
        body.expiration_ttl = effectiveTtl
      }

      const response = await retry(() =>
        fetch(this.getKVUrl(key), {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify(body)
        })
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new CacheTimeoutError(
          `Cloudflare KV set timeout for key ${key}`,
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
  }

  protected async _delete(key: string): Promise<boolean> {
    try {
      const response = await retry(() =>
        fetch(this.getKVUrl(key), {
          method: 'DELETE',
          headers: this.headers
        })
      )

      return response.ok || response.status === 404
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new CacheTimeoutError(
          `Cloudflare KV delete timeout for key ${key}`,
          this.name,
          'delete'
        )
      }
      throw error
    }
  }

  protected async _exists(key: string): Promise<boolean> {
    try {
      const response = await retry(() =>
        fetch(this.getKVUrl(key), {
          method: 'HEAD',
          headers: this.headers
        })
      )

      return response.ok
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new CacheTimeoutError(
          `Cloudflare KV exists timeout for key ${key}`,
          this.name,
          'exists'
        )
      }
      throw error
    }
  }

  protected async _clear(): Promise<void> {
    try {
      // List all keys and delete them
      const keys = await this._keys()
      
      if (keys.length === 0) return

      // Cloudflare KV bulk delete is limited to 10,000 keys per request
      const batches = chunk(keys, 10000)
      
      for (const batch of batches) {
        const response = await retry(() =>
          fetch(
            `${this.apiUrl}/accounts/${this.accountId}/storage/kv/namespaces/${this.namespaceId}/bulk`,
            {
              method: 'DELETE',
              headers: this.headers,
              body: JSON.stringify(batch)
            }
          )
        )

        if (!response.ok) {
          throw new Error(`Bulk delete failed: ${response.status} ${response.statusText}`)
        }
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new CacheTimeoutError(
          'Cloudflare KV clear timeout',
          this.name,
          'clear'
        )
      }
      throw error
    }
  }

  protected async _size(): Promise<number> {
    try {
      const keys = await this._keys()
      return keys.length
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new CacheTimeoutError(
          'Cloudflare KV size timeout',
          this.name,
          'size'
        )
      }
      throw error
    }
  }

  protected async _keys(pattern?: string): Promise<string[]> {
    try {
      const keys: string[] = []
      let cursor: string | undefined
      
      do {
        const url = new URL(this.getKVUrl())
        url.searchParams.set('limit', '1000')
        if (cursor) {
          url.searchParams.set('cursor', cursor)
        }
        if (pattern) {
          url.searchParams.set('prefix', pattern)
        }

        const response = await retry(() =>
          fetch(url.toString(), {
            method: 'GET',
            headers: this.headers
          })
        )

        if (!response.ok) {
          throw new Error(`List keys failed: ${response.status} ${response.statusText}`)
        }

        const data: { result: KVListResult } = await response.json()
        
        keys.push(...data.result.keys.map(k => k.name))
        cursor = data.result.cursor
      } while (cursor)

      return keys
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new CacheTimeoutError(
          'Cloudflare KV keys timeout',
          this.name,
          'keys'
        )
      }
      throw error
    }
  }

  protected async _ttl(key: string): Promise<number> {
    try {
      // Get key metadata to check expiration
      const url = new URL(this.getKVUrl())
      url.searchParams.set('prefix', key)
      url.searchParams.set('limit', '1')

      const response = await retry(() =>
        fetch(url.toString(), {
          method: 'GET',
          headers: this.headers
        })
      )

      if (!response.ok) {
        return -1
      }

      const data: { result: KVListResult } = await response.json()
      const keyData = data.result.keys.find(k => k.name === key)
      
      if (!keyData || !keyData.expiration) {
        return -1
      }

      const remainingSeconds = Math.floor((keyData.expiration * 1000 - Date.now()) / 1000)
      return remainingSeconds > 0 ? remainingSeconds : -1
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new CacheTimeoutError(
          `Cloudflare KV ttl timeout for key ${key}`,
          this.name,
          'ttl'
        )
      }
      throw error
    }
  }

  protected async _expire(key: string, seconds: number): Promise<boolean> {
    try {
      // Get current value
      const value = await this._get(key)
      if (value === null) {
        return false
      }

      // Re-set with new TTL
      await this._set(key, value, seconds)
      return true
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new CacheTimeoutError(
          `Cloudflare KV expire timeout for key ${key}`,
          this.name,
          'expire'
        )
      }
      throw error
    }
  }

  // Override batch operations for better performance
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    // Cloudflare KV doesn't have native batch get, so we parallelize
    const promises = keys.map(key => this.get<T>(key))
    return Promise.all(promises)
  }

  async mset(items: Array<{ key: string; value: any; options?: any }>): Promise<void> {
    // Use bulk write API for better performance
    if (items.length === 0) return

    try {
      const bulkWrites = items.map(item => {
        const fullKey = this.getFullKey(item.key)
        const serialized = serialize(item.value)
        const ttl = item.options?.ttl || this.defaultTTL
        
        const write: any = {
          key: fullKey,
          value: serialized,
          metadata: {
            size: calculateSize(serialized),
            createdAt: Date.now()
          }
        }

        if (ttl > 0) {
          write.expiration_ttl = ttl
        }

        return write
      })

      // Cloudflare KV bulk write is limited to 10,000 operations
      const batches = chunk(bulkWrites, 10000)
      
      for (const batch of batches) {
        const response = await retry(() =>
          fetch(
            `${this.apiUrl}/accounts/${this.accountId}/storage/kv/namespaces/${this.namespaceId}/bulk`,
            {
              method: 'PUT',
              headers: this.headers,
              body: JSON.stringify(batch)
            }
          )
        )

        if (!response.ok) {
          throw new Error(`Bulk write failed: ${response.status} ${response.statusText}`)
        }
      }

      // Record metrics
      for (const item of items) {
        const fullKey = this.getFullKey(item.key)
        this.monitor.recordSet(fullKey, calculateSize(item.value), 0)
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        throw new CacheTimeoutError(
          'Cloudflare KV mset timeout',
          this.name,
          'mset'
        )
      }
      throw error
    }
  }

  // Tag operations - using metadata
  protected async setTags(key: string, tags: string[]): Promise<void> {
    const value = await this._get(key)
    if (value === null) return

    // Get current TTL
    const ttl = await this._ttl(key)
    
    // Re-set with updated metadata
    await this._set(key, value, ttl > 0 ? ttl : undefined)
    
    // Update tag index (stored as separate keys)
    for (const tag of tags) {
      const tagKey = `__tag:${tag}`
      const taggedKeys = await this._get<string[]>(tagKey) || []
      if (!taggedKeys.includes(key)) {
        taggedKeys.push(key)
        await this._set(tagKey, taggedKeys, 86400 * 30) // 30 days
      }
    }
  }

  protected async getTags(key: string): Promise<string[]> {
    // Get from metadata
    const url = new URL(this.getKVUrl())
    url.searchParams.set('prefix', key)
    url.searchParams.set('limit', '1')

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.headers
      })

      if (!response.ok) {
        return []
      }

      const data: { result: KVListResult } = await response.json()
      const keyData = data.result.keys.find(k => k.name === key)
      
      return keyData?.metadata?.tags || []
    } catch {
      return []
    }
  }

  async taggedGet(tags: string[]): Promise<CacheItem[]> {
    const items: CacheItem[] = []
    
    // Get all keys for each tag
    const keysByTag = await Promise.all(
      tags.map(tag => this._get<string[]>(`__tag:${tag}`) || [])
    )
    
    // Find intersection
    const allKeys = keysByTag.reduce((acc, keys) => {
      if (acc.length === 0) return keys
      return acc.filter(key => keys.includes(key))
    })
    
    // Get values for matching keys
    for (const key of allKeys) {
      const value = await this._get(key)
      if (value !== null) {
        const tags = await this.getTags(key)
        
        items.push({
          key: key.replace(`${this.namespace}:`, ''),
          value,
          tags,
          createdAt: Date.now()
        })
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

  /**
   * Get cache statistics for edge locations
   */
  async getEdgeStats(): Promise<{
    locations: string[]
    hitRate: number
    bandwidth: number
  }> {
    // This would require Cloudflare Analytics API
    // For now, return placeholder data
    return {
      locations: ['US', 'EU', 'ASIA'],
      hitRate: 0,
      bandwidth: 0
    }
  }
}