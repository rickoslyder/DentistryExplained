/**
 * Cache Monitoring Implementation
 */

import { CacheMonitor, CacheStats } from '../types'

export class CacheMonitorImpl implements CacheMonitor {
  private stats: CacheStats
  private startTime: number

  constructor() {
    this.startTime = Date.now()
    this.stats = this.createEmptyStats()
  }

  recordHit(key: string, responseTime: number): void {
    this.stats.hits++
    this.updateAvgResponseTime(responseTime)
    this.updateHitRate()
  }

  recordMiss(key: string, responseTime: number): void {
    this.stats.misses++
    this.updateAvgResponseTime(responseTime)
    this.updateHitRate()
  }

  recordSet(key: string, size: number, responseTime: number): void {
    this.stats.sets++
    this.stats.size += size
    this.updateAvgResponseTime(responseTime)
  }

  recordDelete(key: string, responseTime: number): void {
    this.stats.deletes++
    this.updateAvgResponseTime(responseTime)
  }

  recordError(error: Error, operation: string): void {
    this.stats.errors++
    this.stats.lastError = `${operation}: ${error.message}`
  }

  getStats(): CacheStats {
    return {
      ...this.stats,
      uptime: Date.now() - this.startTime
    }
  }

  reset(): void {
    this.startTime = Date.now()
    this.stats = this.createEmptyStats()
  }

  private createEmptyStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      hitRate: 0,
      avgResponseTime: 0,
      errors: 0,
      uptime: 0
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0
  }

  private updateAvgResponseTime(responseTime: number): void {
    const totalOps = this.stats.hits + this.stats.misses + this.stats.sets + this.stats.deletes
    if (totalOps === 1) {
      this.stats.avgResponseTime = responseTime
    } else {
      // Running average
      this.stats.avgResponseTime = 
        (this.stats.avgResponseTime * (totalOps - 1) + responseTime) / totalOps
    }
  }
}

// Advanced monitoring with metrics export
export class AdvancedCacheMonitor extends CacheMonitorImpl {
  private metricsBuffer: Array<{
    timestamp: number
    metric: string
    value: number
    tags: Record<string, string>
  }> = []
  
  private readonly maxBufferSize = 1000
  private flushInterval?: NodeJS.Timeout
  private metricsEndpoint?: string

  constructor(metricsEndpoint?: string, flushIntervalMs: number = 60000) {
    super()
    this.metricsEndpoint = metricsEndpoint
    
    if (metricsEndpoint) {
      this.startFlushInterval(flushIntervalMs)
    }
  }

  recordHit(key: string, responseTime: number): void {
    super.recordHit(key, responseTime)
    this.addMetric('cache.hit', 1, { key })
    this.addMetric('cache.response_time', responseTime, { operation: 'get', result: 'hit' })
  }

  recordMiss(key: string, responseTime: number): void {
    super.recordMiss(key, responseTime)
    this.addMetric('cache.miss', 1, { key })
    this.addMetric('cache.response_time', responseTime, { operation: 'get', result: 'miss' })
  }

  recordSet(key: string, size: number, responseTime: number): void {
    super.recordSet(key, size, responseTime)
    this.addMetric('cache.set', 1, { key })
    this.addMetric('cache.size', size, { operation: 'set' })
    this.addMetric('cache.response_time', responseTime, { operation: 'set' })
  }

  recordDelete(key: string, responseTime: number): void {
    super.recordDelete(key, responseTime)
    this.addMetric('cache.delete', 1, { key })
    this.addMetric('cache.response_time', responseTime, { operation: 'delete' })
  }

  recordError(error: Error, operation: string): void {
    super.recordError(error, operation)
    this.addMetric('cache.error', 1, { 
      operation, 
      error_type: error.constructor.name,
      error_message: error.message.substring(0, 100)
    })
  }

  private addMetric(
    metric: string, 
    value: number, 
    tags: Record<string, string> = {}
  ): void {
    this.metricsBuffer.push({
      timestamp: Date.now(),
      metric,
      value,
      tags
    })

    // Flush if buffer is full
    if (this.metricsBuffer.length >= this.maxBufferSize) {
      this.flush().catch(console.error)
    }
  }

  private startFlushInterval(intervalMs: number): void {
    this.flushInterval = setInterval(() => {
      this.flush().catch(console.error)
    }, intervalMs)
  }

  async flush(): Promise<void> {
    if (!this.metricsEndpoint || this.metricsBuffer.length === 0) {
      return
    }

    const metrics = [...this.metricsBuffer]
    this.metricsBuffer = []

    try {
      // Send metrics to endpoint
      await fetch(this.metricsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics })
      })
    } catch (error) {
      console.error('Failed to flush cache metrics:', error)
      // Put metrics back if failed
      this.metricsBuffer.unshift(...metrics.slice(0, this.maxBufferSize - this.metricsBuffer.length))
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush().catch(console.error)
  }
}

// Export singleton instance
export const cacheMonitor = new CacheMonitorImpl()