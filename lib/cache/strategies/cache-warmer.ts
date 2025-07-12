/**
 * Cache Warming Strategy
 * 
 * Pre-loads frequently accessed data into cache
 */

import { CacheManager } from '../cache-manager'
import { CacheWarmingStrategy } from '../types'
import { chunk } from '../utils/helpers'

export interface WarmingResult {
  totalKeys: number
  successCount: number
  failureCount: number
  duration: number
  errors: Array<{ key: string; error: string }>
}

export class CacheWarmer {
  private strategies: Map<string, CacheWarmingStrategy> = new Map()
  private warmingQueue: Array<() => Promise<void>> = new Map()
  private isWarming: boolean = false
  private scheduledWarmings: Map<string, NodeJS.Timeout> = new Map()

  constructor(private cacheManager: CacheManager) {}

  /**
   * Register a warming strategy
   */
  registerStrategy(strategy: CacheWarmingStrategy): void {
    this.strategies.set(strategy.id, strategy)
    
    // Schedule if needed
    if (strategy.schedule) {
      this.scheduleWarming(strategy)
    }
  }

  /**
   * Unregister a warming strategy
   */
  unregisterStrategy(strategyId: string): void {
    this.strategies.delete(strategyId)
    
    // Cancel scheduled warming
    const timeout = this.scheduledWarmings.get(strategyId)
    if (timeout) {
      clearInterval(timeout)
      this.scheduledWarmings.delete(strategyId)
    }
  }

  /**
   * Execute warming for specific strategy
   */
  async warmByStrategy(
    strategyId: string,
    options: { async?: boolean } = {}
  ): Promise<WarmingResult> {
    const strategy = this.strategies.get(strategyId)
    if (!strategy) {
      throw new Error(`Warming strategy ${strategyId} not found`)
    }

    if (options.async) {
      this.queueWarming(async () => {
        await this.executeStrategy(strategy)
      })
      
      return {
        totalKeys: 0,
        successCount: 0,
        failureCount: 0,
        duration: 0,
        errors: []
      }
    }

    return this.executeStrategy(strategy)
  }

  /**
   * Execute all warming strategies
   */
  async warmAll(
    options: { priority?: number; async?: boolean } = {}
  ): Promise<WarmingResult[]> {
    const strategies = Array.from(this.strategies.values())
      .filter(s => !options.priority || s.priority >= options.priority)
      .sort((a, b) => b.priority - a.priority)

    const results: WarmingResult[] = []

    for (const strategy of strategies) {
      const result = await this.warmByStrategy(strategy.id, options)
      results.push(result)
    }

    return results
  }

  /**
   * Warm specific keys
   */
  async warmKeys(
    keys: string[],
    dataFetcher: (key: string) => Promise<any>,
    options: { ttl?: number; batchSize?: number } = {}
  ): Promise<WarmingResult> {
    const startTime = Date.now()
    const errors: Array<{ key: string; error: string }> = []
    let successCount = 0
    let failureCount = 0

    const batches = chunk(keys, options.batchSize || 10)

    for (const batch of batches) {
      const promises = batch.map(async key => {
        try {
          const data = await dataFetcher(key)
          await this.cacheManager.set(key, data, { ttl: options.ttl })
          successCount++
        } catch (error) {
          failureCount++
          errors.push({ key, error: error.message })
        }
      })

      await Promise.all(promises)
    }

    return {
      totalKeys: keys.length,
      successCount,
      failureCount,
      duration: Date.now() - startTime,
      errors
    }
  }

  /**
   * Warm by pattern
   */
  async warmByPattern(
    pattern: string,
    dataFetcher: (key: string) => Promise<any>,
    options: { ttl?: number; maxKeys?: number } = {}
  ): Promise<WarmingResult> {
    // This would need to be implemented based on your data structure
    // For example, if pattern is "user:*", you'd fetch all user IDs
    // and warm their data
    
    const keys: string[] = [] // Fetch keys matching pattern
    
    if (options.maxKeys && keys.length > options.maxKeys) {
      keys.length = options.maxKeys
    }

    return this.warmKeys(keys, dataFetcher, options)
  }

  /**
   * Execute a warming strategy
   */
  private async executeStrategy(
    strategy: CacheWarmingStrategy
  ): Promise<WarmingResult> {
    const startTime = Date.now()
    const errors: Array<{ key: string; error: string }> = []
    let successCount = 0
    let failureCount = 0

    let keys: string[] = []

    // Determine keys to warm
    if (strategy.keys) {
      keys = strategy.keys
    } else if (strategy.pattern) {
      // Fetch keys matching pattern (implementation depends on your data)
      keys = await this.fetchKeysByPattern(strategy.pattern)
    }

    // Warm keys in batches
    const batches = chunk(keys, strategy.batchSize || 10)

    for (const batch of batches) {
      const promises = batch.map(async key => {
        try {
          const data = await strategy.dataFetcher(key)
          await this.cacheManager.set(key, data)
          successCount++
        } catch (error) {
          failureCount++
          errors.push({ key, error: error.message })
        }
      })

      await Promise.all(promises)
    }

    return {
      totalKeys: keys.length,
      successCount,
      failureCount,
      duration: Date.now() - startTime,
      errors
    }
  }

  /**
   * Queue warming for async processing
   */
  private queueWarming(operation: () => Promise<void>): void {
    this.warmingQueue.push(operation)
    
    if (!this.isWarming) {
      this.processQueue().catch(console.error)
    }
  }

  /**
   * Process warming queue
   */
  private async processQueue(): Promise<void> {
    if (this.isWarming || this.warmingQueue.length === 0) {
      return
    }
    
    this.isWarming = true
    
    while (this.warmingQueue.length > 0) {
      const operation = this.warmingQueue.shift()
      if (operation) {
        try {
          await operation()
        } catch (error) {
          console.error('Warming operation failed:', error)
        }
      }
    }
    
    this.isWarming = false
  }

  /**
   * Schedule periodic warming
   */
  private scheduleWarming(strategy: CacheWarmingStrategy): void {
    if (!strategy.schedule) return
    
    // Parse schedule (simplified cron)
    const [interval, unit] = strategy.schedule.split(' ')
    const intervalMs = this.parseInterval(parseInt(interval), unit)
    
    if (intervalMs > 0) {
      const timeout = setInterval(async () => {
        try {
          await this.executeStrategy(strategy)
        } catch (error) {
          console.error(`Scheduled warming failed for strategy ${strategy.id}:`, error)
        }
      }, intervalMs)
      
      this.scheduledWarmings.set(strategy.id, timeout)
    }
  }

  /**
   * Parse interval to milliseconds
   */
  private parseInterval(value: number, unit: string): number {
    switch (unit.toLowerCase()) {
      case 's':
      case 'sec':
      case 'second':
      case 'seconds':
        return value * 1000
      case 'm':
      case 'min':
      case 'minute':
      case 'minutes':
        return value * 60 * 1000
      case 'h':
      case 'hr':
      case 'hour':
      case 'hours':
        return value * 60 * 60 * 1000
      case 'd':
      case 'day':
      case 'days':
        return value * 24 * 60 * 60 * 1000
      default:
        return 0
    }
  }

  /**
   * Fetch keys by pattern (placeholder - implement based on your data)
   */
  private async fetchKeysByPattern(pattern: string): Promise<string[]> {
    // This would typically query your database or index
    // to find keys matching the pattern
    return []
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    for (const timeout of this.scheduledWarmings.values()) {
      clearInterval(timeout)
    }
    this.scheduledWarmings.clear()
    this.strategies.clear()
    this.warmingQueue = []
  }
}

// Predefined warming strategies for common use cases
export const commonWarmingStrategies: CacheWarmingStrategy[] = [
  {
    id: 'popular-articles',
    name: 'Popular Articles',
    priority: 10,
    batchSize: 5,
    schedule: '30 minutes',
    dataFetcher: async (key: string) => {
      // Fetch article data from database
      const articleId = key.replace('article:', '')
      // return await fetchArticle(articleId)
      return { id: articleId, title: 'Sample Article' }
    },
    pattern: 'article:popular:*'
  },
  {
    id: 'user-sessions',
    name: 'Active User Sessions',
    priority: 8,
    batchSize: 20,
    schedule: '5 minutes',
    dataFetcher: async (key: string) => {
      // Fetch user session data
      const userId = key.replace('session:', '')
      // return await fetchUserSession(userId)
      return { userId, active: true }
    },
    pattern: 'session:active:*'
  },
  {
    id: 'glossary-terms',
    name: 'Glossary Terms',
    priority: 5,
    batchSize: 50,
    schedule: '1 hour',
    dataFetcher: async (key: string) => {
      // Fetch glossary term
      const termId = key.replace('glossary:', '')
      // return await fetchGlossaryTerm(termId)
      return { id: termId, term: 'Sample Term' }
    },
    keys: [] // Will be populated with actual glossary term IDs
  }
]

// Export singleton instance
export const cacheWarmer = new CacheWarmer(CacheManager.getInstance())