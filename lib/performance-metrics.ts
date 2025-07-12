/**
 * Performance Metrics Collection
 * Collects real performance data from the application
 */

import { analytics } from './analytics-unified'

interface PerformanceEntry {
  name: string
  entryType: string
  startTime: number
  duration: number
}

interface NavigationTiming {
  domContentLoadedEventEnd: number
  domContentLoadedEventStart: number
  domInteractive: number
  domainLookupEnd: number
  domainLookupStart: number
  fetchStart: number
  loadEventEnd: number
  loadEventStart: number
  requestStart: number
  responseEnd: number
  responseStart: number
}

class PerformanceMetricsCollector {
  private static instance: PerformanceMetricsCollector
  private metricsQueue: any[] = []
  private isInitialized = false

  private constructor() {}

  static getInstance(): PerformanceMetricsCollector {
    if (!PerformanceMetricsCollector.instance) {
      PerformanceMetricsCollector.instance = new PerformanceMetricsCollector()
    }
    return PerformanceMetricsCollector.instance
  }

  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return
    
    this.isInitialized = true

    // Observe Core Web Vitals
    this.observeWebVitals()
    
    // Observe navigation timing
    this.observeNavigationTiming()
    
    // Observe resource timing
    this.observeResourceTiming()
    
    // Observe long tasks
    this.observeLongTasks()
    
    // Send metrics every 30 seconds
    setInterval(() => this.flushMetrics(), 30000)
    
    // Send metrics on page unload
    window.addEventListener('beforeunload', () => this.flushMetrics())
  }

  private observeWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          
          this.recordMetric('lcp', {
            value: lastEntry.renderTime || lastEntry.loadTime,
            element: lastEntry.element?.tagName,
          })
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        console.warn('LCP observer not supported')
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.recordMetric('fid', {
              value: entry.processingStart - entry.startTime,
              target: entry.target?.tagName,
            })
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        console.warn('FID observer not supported')
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
              this.recordMetric('cls', {
                value: clsValue,
                sources: entry.sources?.length || 0,
              })
            }
          })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        console.warn('CLS observer not supported')
      }
    }
  }

  private observeNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as any
          
          if (navigation) {
            this.recordMetric('navigation', {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              domInteractive: navigation.domInteractive - navigation.fetchStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              ttfb: navigation.responseStart - navigation.requestStart,
              dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcpConnect: navigation.connectEnd - navigation.connectStart,
              request: navigation.responseStart - navigation.requestStart,
              response: navigation.responseEnd - navigation.responseStart,
              domProcessing: navigation.domComplete - navigation.domLoading,
              pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
            })
          }
        }, 0)
      })
    }
  }

  private observeResourceTiming() {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          
          entries.forEach((entry: any) => {
            // Only track significant resources
            if (entry.duration > 100) {
              this.recordMetric('resource', {
                name: entry.name,
                type: entry.initiatorType,
                duration: entry.duration,
                size: entry.transferSize || 0,
                cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
              })
            }
          })
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
      } catch (e) {
        console.warn('Resource timing observer not supported')
      }
    }
  }

  private observeLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          
          entries.forEach((entry) => {
            this.recordMetric('long_task', {
              duration: entry.duration,
              startTime: entry.startTime,
            })
          })
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        console.warn('Long task observer not supported')
      }
    }
  }

  recordMetric(type: string, data: any) {
    this.metricsQueue.push({
      type,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    })
  }

  private flushMetrics() {
    if (this.metricsQueue.length === 0) return

    const metrics = [...this.metricsQueue]
    this.metricsQueue = []

    // Send to analytics
    analytics.track('performance_metrics', {
      metrics,
      count: metrics.length,
    })

    // Also send to server for aggregation
    fetch('/api/analytics/performance/collect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics }),
    }).catch(console.error)
  }

  // Get current Web Vitals
  getWebVitals() {
    const vitals = {
      lcp: null as number | null,
      fid: null as number | null,
      cls: null as number | null,
      ttfb: null as number | null,
    }

    // Get from recent metrics
    const recentMetrics = this.metricsQueue.filter(m => 
      ['lcp', 'fid', 'cls', 'navigation'].includes(m.type)
    )

    recentMetrics.forEach(metric => {
      switch (metric.type) {
        case 'lcp':
          vitals.lcp = metric.data.value
          break
        case 'fid':
          vitals.fid = metric.data.value
          break
        case 'cls':
          vitals.cls = metric.data.value
          break
        case 'navigation':
          vitals.ttfb = metric.data.ttfb
          break
      }
    })

    return vitals
  }

  // Get performance summary
  getPerformanceSummary() {
    const navigation = performance.getEntriesByType('navigation')[0] as any
    
    return {
      pageLoadTime: navigation?.loadEventEnd - navigation?.fetchStart || 0,
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart || 0,
      resources: performance.getEntriesByType('resource').length,
      webVitals: this.getWebVitals(),
    }
  }
}

// Export singleton instance
export const performanceMetrics = PerformanceMetricsCollector.getInstance()

// Auto-initialize when imported in browser
if (typeof window !== 'undefined') {
  performanceMetrics.initialize()
}