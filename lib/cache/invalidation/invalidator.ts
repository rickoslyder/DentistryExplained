/**
 * Cache Invalidation System
 * 
 * Handles various cache invalidation strategies including:
 * - Tag-based invalidation
 * - Pattern matching
 * - Time-based invalidation
 * - Cascade invalidation
 */

import { CacheManager } from '../cache-manager'
import { CacheInvalidationRule, CacheProvider } from '../types'
import { matchPattern } from '../utils/helpers'

export interface InvalidationOptions {
  cascade?: boolean
  async?: boolean
  delay?: number
  batchSize?: number
}

export interface InvalidationResult {
  keysInvalidated: number
  errors: Array<{ key: string; error: string }>
  duration: number
}

export class CacheInvalidator {
  private rules: Map<string, CacheInvalidationRule> = new Map()
  private scheduledInvalidations: Map<string, NodeJS.Timeout> = new Map()
  private invalidationQueue: Array<() => Promise<void>> = []
  private isProcessing: boolean = false

  constructor(private cacheManager: CacheManager) {}

  /**
   * Register an invalidation rule
   */
  registerRule(rule: CacheInvalidationRule): void {
    this.rules.set(rule.id, rule)
    
    // Set up scheduled invalidation if specified
    if (rule.schedule) {
      this.scheduleInvalidation(rule)
    }
  }

  /**
   * Unregister an invalidation rule
   */
  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId)
    
    // Cancel scheduled invalidation
    const timeout = this.scheduledInvalidations.get(ruleId)
    if (timeout) {
      clearTimeout(timeout)
      this.scheduledInvalidations.delete(ruleId)
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(
    tags: string[],
    options: InvalidationOptions = {}
  ): Promise<InvalidationResult> {
    const startTime = Date.now()
    const errors: Array<{ key: string; error: string }> = []
    
    try {
      const keysInvalidated = await this.cacheManager.invalidateByTags(tags)
      
      // Handle cascade invalidation
      if (options.cascade) {
        await this.cascadeInvalidation(tags)
      }
      
      return {
        keysInvalidated,
        errors,
        duration: Date.now() - startTime
      }
    } catch (error) {
      errors.push({ key: '*', error: error.message })
      return {
        keysInvalidated: 0,
        errors,
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(
    pattern: string,
    options: InvalidationOptions = {}
  ): Promise<InvalidationResult> {
    const startTime = Date.now()
    const errors: Array<{ key: string; error: string }> = []
    let keysInvalidated = 0
    
    try {
      // Get all cache providers
      const stats = await this.cacheManager.stats()
      
      for (const [providerName, _] of Object.entries(stats)) {
        const provider = this.cacheManager.getProvider(providerName)
        if (!provider) continue
        
        try {
          const keys = await provider.keys()
          const matchingKeys = keys.filter(key => matchPattern(pattern, key))
          
          if (options.batchSize) {
            // Batch invalidation
            for (let i = 0; i < matchingKeys.length; i += options.batchSize) {
              const batch = matchingKeys.slice(i, i + options.batchSize)
              const deleted = await provider.mdelete(batch)
              keysInvalidated += deleted
              
              if (options.delay) {
                await new Promise(resolve => setTimeout(resolve, options.delay))
              }
            }
          } else {
            // Delete all at once
            const deleted = await provider.mdelete(matchingKeys)
            keysInvalidated += deleted
          }
        } catch (error) {
          errors.push({ 
            key: `${providerName}:${pattern}`, 
            error: error.message 
          })
        }
      }
      
      return {
        keysInvalidated,
        errors,
        duration: Date.now() - startTime
      }
    } catch (error) {
      errors.push({ key: pattern, error: error.message })
      return {
        keysInvalidated,
        errors,
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Invalidate specific keys
   */
  async invalidateKeys(
    keys: string[],
    options: InvalidationOptions = {}
  ): Promise<InvalidationResult> {
    const startTime = Date.now()
    const errors: Array<{ key: string; error: string }> = []
    let keysInvalidated = 0
    
    if (options.async) {
      // Queue for async processing
      this.queueInvalidation(async () => {
        for (const key of keys) {
          try {
            if (await this.cacheManager.delete(key)) {
              keysInvalidated++
            }
          } catch (error) {
            errors.push({ key, error: error.message })
          }
        }
      })
      
      return {
        keysInvalidated: 0,
        errors: [],
        duration: 0
      }
    }
    
    // Synchronous invalidation
    for (const key of keys) {
      try {
        if (await this.cacheManager.delete(key)) {
          keysInvalidated++
        }
      } catch (error) {
        errors.push({ key, error: error.message })
      }
    }
    
    return {
      keysInvalidated,
      errors,
      duration: Date.now() - startTime
    }
  }

  /**
   * Apply invalidation rules
   */
  async applyRules(
    triggerEvent: string,
    context?: any
  ): Promise<InvalidationResult[]> {
    const results: InvalidationResult[] = []
    
    for (const rule of this.rules.values()) {
      // Check if rule should be applied
      if (!this.shouldApplyRule(rule, triggerEvent, context)) {
        continue
      }
      
      let result: InvalidationResult
      
      if (rule.tags) {
        result = await this.invalidateByTags(rule.tags, {
          cascade: rule.cascade
        })
      } else if (rule.pattern) {
        result = await this.invalidateByPattern(rule.pattern, {
          cascade: rule.cascade
        })
      } else {
        continue
      }
      
      // Execute callback if provided
      if (rule.callback && result.keysInvalidated > 0) {
        try {
          const invalidatedKeys = rule.pattern 
            ? await this.getMatchingKeys(rule.pattern)
            : []
          await rule.callback(invalidatedKeys)
        } catch (error) {
          result.errors.push({ 
            key: 'callback', 
            error: error.message 
          })
        }
      }
      
      results.push(result)
    }
    
    return results
  }

  /**
   * Clear all cache
   */
  async invalidateAll(
    options: InvalidationOptions = {}
  ): Promise<InvalidationResult> {
    const startTime = Date.now()
    const errors: Array<{ key: string; error: string }> = []
    
    try {
      await this.cacheManager.clear()
      
      return {
        keysInvalidated: -1, // Unknown count
        errors,
        duration: Date.now() - startTime
      }
    } catch (error) {
      errors.push({ key: '*', error: error.message })
      return {
        keysInvalidated: 0,
        errors,
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Cascade invalidation for related data
   */
  private async cascadeInvalidation(tags: string[]): Promise<void> {
    // Define cascade relationships
    const cascadeMap: Record<string, string[]> = {
      'user': ['user-sessions', 'user-preferences', 'user-activity'],
      'article': ['article-views', 'article-comments', 'search-index'],
      'chat': ['chat-sessions', 'chat-history'],
      'settings': ['config', 'features', 'permissions']
    }
    
    const additionalTags = new Set<string>()
    
    for (const tag of tags) {
      const cascadeTags = cascadeMap[tag]
      if (cascadeTags) {
        cascadeTags.forEach(t => additionalTags.add(t))
      }
      
      // Also check for parent tags (e.g., 'user:123' -> 'user')
      const parentTag = tag.split(':')[0]
      if (parentTag !== tag && cascadeMap[parentTag]) {
        cascadeMap[parentTag].forEach(t => additionalTags.add(t))
      }
    }
    
    if (additionalTags.size > 0) {
      await this.cacheManager.invalidateByTags(Array.from(additionalTags))
    }
  }

  /**
   * Queue invalidation for async processing
   */
  private queueInvalidation(operation: () => Promise<void>): void {
    this.invalidationQueue.push(operation)
    
    if (!this.isProcessing) {
      this.processQueue().catch(console.error)
    }
  }

  /**
   * Process invalidation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.invalidationQueue.length === 0) {
      return
    }
    
    this.isProcessing = true
    
    while (this.invalidationQueue.length > 0) {
      const operation = this.invalidationQueue.shift()
      if (operation) {
        try {
          await operation()
        } catch (error) {
          console.error('Invalidation operation failed:', error)
        }
      }
    }
    
    this.isProcessing = false
  }

  /**
   * Schedule periodic invalidation
   */
  private scheduleInvalidation(rule: CacheInvalidationRule): void {
    if (!rule.schedule) return
    
    // Parse cron-like schedule (simplified)
    const [interval, unit] = rule.schedule.split(' ')
    const intervalMs = this.parseInterval(parseInt(interval), unit)
    
    if (intervalMs > 0) {
      const timeout = setInterval(async () => {
        try {
          await this.applyRules('scheduled', { ruleId: rule.id })
        } catch (error) {
          console.error(`Scheduled invalidation failed for rule ${rule.id}:`, error)
        }
      }, intervalMs)
      
      this.scheduledInvalidations.set(rule.id, timeout)
    }
  }

  /**
   * Parse interval string to milliseconds
   */
  private parseInterval(value: number, unit: string): number {
    switch (unit) {
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
   * Check if rule should be applied
   */
  private shouldApplyRule(
    rule: CacheInvalidationRule,
    event: string,
    context?: any
  ): boolean {
    // Add custom logic here based on rule conditions
    return true
  }

  /**
   * Get keys matching a pattern
   */
  private async getMatchingKeys(pattern: string): Promise<string[]> {
    const allKeys: string[] = []
    const stats = await this.cacheManager.stats()
    
    for (const [providerName, _] of Object.entries(stats)) {
      const provider = this.cacheManager.getProvider(providerName)
      if (!provider) continue
      
      try {
        const keys = await provider.keys()
        const matching = keys.filter(key => matchPattern(pattern, key))
        allKeys.push(...matching)
      } catch (error) {
        console.error(`Failed to get keys from ${providerName}:`, error)
      }
    }
    
    return allKeys
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Clear all scheduled invalidations
    for (const timeout of this.scheduledInvalidations.values()) {
      clearInterval(timeout)
    }
    this.scheduledInvalidations.clear()
    this.rules.clear()
    this.invalidationQueue = []
  }
}

// Export singleton instance
export const cacheInvalidator = new CacheInvalidator(CacheManager.getInstance())