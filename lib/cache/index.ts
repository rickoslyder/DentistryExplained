/**
 * Cache System Main Export
 * 
 * Provides a unified interface for all caching functionality
 */

// Core exports
export * from './types'
export { cacheManager, CacheManager, Cacheable, CacheEvict } from './cache-manager'
export { BaseCacheProvider } from './base-provider'

// Provider exports
export { MemoryCacheProvider } from './providers/memory-cache'
export { RedisCacheProvider } from './providers/redis-cache'
export { CloudflareKVProvider } from './providers/cloudflare-kv'

// Invalidation exports
export { cacheInvalidator, CacheInvalidator } from './invalidation/invalidator'

// Strategy exports
export { CacheWarmer, commonWarmingStrategies } from './strategies/cache-warmer'

// Utility exports
export * from './utils/helpers'
export { CacheMonitorImpl, AdvancedCacheMonitor } from './utils/monitor'

// Re-export commonly used functions for convenience
import { cacheManager } from './cache-manager'
import { cacheInvalidator } from './invalidation/invalidator'

/**
 * Initialize the cache system
 */
export async function initializeCache(): Promise<void> {
  await cacheManager.initialize()
}

/**
 * Get a value from cache
 */
export async function get<T = any>(key: string): Promise<T | null> {
  return cacheManager.get<T>(key)
}

/**
 * Set a value in cache
 */
export async function set<T = any>(
  key: string, 
  value: T, 
  options?: { ttl?: number; tags?: string[] }
): Promise<void> {
  return cacheManager.set(key, value, options)
}

/**
 * Delete a value from cache
 */
export async function del(key: string): Promise<boolean> {
  return cacheManager.delete(key)
}

/**
 * Clear all cache
 */
export async function clear(): Promise<void> {
  return cacheManager.clear()
}

/**
 * Invalidate cache by tags
 */
export async function invalidateByTags(tags: string[]): Promise<number> {
  return cacheManager.invalidateByTags(tags)
}

/**
 * Get cache statistics
 */
export async function stats(): Promise<any> {
  return cacheManager.stats()
}

/**
 * Check cache health
 */
export async function isHealthy(): Promise<boolean> {
  return cacheManager.isHealthy()
}

// Default export for convenience
export default {
  initialize: initializeCache,
  get,
  set,
  del,
  clear,
  invalidateByTags,
  stats,
  isHealthy,
  manager: cacheManager,
  invalidator: cacheInvalidator
}