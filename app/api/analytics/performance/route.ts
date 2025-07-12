import { NextRequest, NextResponse } from 'next/server'
import { startOfHour, startOfDay, subHours, subDays } from 'date-fns'
import { unifiedAnalytics } from '@/lib/analytics-unified'

// Mock data generator for demo - replace with real metrics collection
function generateMockMetrics(hours: number) {
  const now = new Date()
  const history = []
  
  for (let i = hours; i > 0; i--) {
    history.push({
      timestamp: subHours(now, i),
      value: Math.random() * 200 + 300 + (Math.sin(i) * 50), // Simulate variation
    })
  }
  
  return history
}

function calculateWebVitalRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    lcp: { good: 2500, poor: 4000 },
    fid: { good: 100, poor: 300 },
    cls: { good: 0.1, poor: 0.25 },
    ttfb: { good: 800, poor: 1800 },
  }
  
  const threshold = thresholds[metric as keyof typeof thresholds]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value >= threshold.poor) return 'poor'
  return 'needs-improvement'
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication using Clerk directly
    const { auth } = await import('@clerk/nextjs/server')
    const { userId } = await auth()
    
    if (!userId) {
      console.log('[Performance API] No userId from Clerk auth')
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }
    
    console.log('[Performance API] Authenticated user:', userId)

    // Get time range from query params
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || '24h'
    
    let hours = 24
    switch (range) {
      case '1h': hours = 1; break
      case '24h': hours = 24; break
      case '7d': hours = 168; break
      case '30d': hours = 720; break
    }

    // In production, these would come from:
    // 1. Real User Monitoring (RUM) data
    // 2. Application Performance Monitoring (APM) tools
    // 3. Server logs and metrics
    // 4. Database query logs
    // 5. CDN analytics
    
    const pageLoadHistory = generateMockMetrics(Math.min(hours, 48))
    const serverResponseHistory = generateMockMetrics(Math.min(hours, 48))
    const dbQueryHistory = generateMockMetrics(Math.min(hours, 48))
    const cacheHistory = generateMockMetrics(Math.min(hours, 48)).map(item => ({
      ...item,
      value: Math.random() * 30 + 70, // Cache hit rate 70-100%
    }))

    // Calculate current and average values
    const pageLoadCurrent = pageLoadHistory[pageLoadHistory.length - 1]?.value || 0
    const pageLoadAvg = pageLoadHistory.reduce((sum, item) => sum + item.value, 0) / pageLoadHistory.length
    
    const serverResponseCurrent = serverResponseHistory[serverResponseHistory.length - 1]?.value || 0
    const serverResponseAvg = serverResponseHistory.reduce((sum, item) => sum + item.value, 0) / serverResponseHistory.length
    
    const dbQueryCurrent = dbQueryHistory[dbQueryHistory.length - 1]?.value || 0
    const dbQueryAvg = dbQueryHistory.reduce((sum, item) => sum + item.value, 0) / dbQueryHistory.length
    
    const cacheHitCurrent = cacheHistory[cacheHistory.length - 1]?.value || 0
    const cacheHitAvg = cacheHistory.reduce((sum, item) => sum + item.value, 0) / cacheHistory.length

    // Mock Core Web Vitals (in production, get from RUM data)
    const coreWebVitals = {
      lcp: { value: 2200, rating: calculateWebVitalRating('lcp', 2200) },
      fid: { value: 85, rating: calculateWebVitalRating('fid', 85) },
      cls: { value: 0.08, rating: calculateWebVitalRating('cls', 0.08) },
      ttfb: { value: 650, rating: calculateWebVitalRating('ttfb', 650) },
    }

    // Mock error data (in production, aggregate from error tracking)
    const errorTypes = [
      { type: '404 Not Found', count: 23, lastOccurred: subHours(new Date(), 2) },
      { type: '500 Server Error', count: 5, lastOccurred: subHours(new Date(), 12) },
      { type: 'API Timeout', count: 12, lastOccurred: subHours(new Date(), 1) },
      { type: 'Database Connection', count: 2, lastOccurred: subDays(new Date(), 1) },
    ]

    const performanceData = {
      pageLoad: {
        current: pageLoadCurrent,
        average: pageLoadAvg,
        p95: pageLoadAvg * 1.5, // Mock P95
        trend: ((pageLoadCurrent - pageLoadAvg) / pageLoadAvg) * 100,
        history: pageLoadHistory,
      },
      serverResponse: {
        current: serverResponseCurrent,
        average: serverResponseAvg,
        p95: serverResponseAvg * 1.4,
        trend: ((serverResponseCurrent - serverResponseAvg) / serverResponseAvg) * 100,
        history: serverResponseHistory,
      },
      databaseQueries: {
        current: dbQueryCurrent,
        average: dbQueryAvg,
        slowQueries: Math.floor(Math.random() * 10) + 5,
        history: dbQueryHistory,
      },
      cacheHitRate: {
        current: cacheHitCurrent,
        average: cacheHitAvg,
        trend: ((cacheHitCurrent - cacheHitAvg) / cacheHitAvg) * 100,
        history: cacheHistory,
      },
      errorRate: {
        current: 0.3 + Math.random() * 0.5, // 0.3-0.8%
        average: 0.5,
        trend: Math.random() > 0.5 ? 15 : -10,
        errors: errorTypes,
      },
      infrastructure: {
        cpu: Math.random() * 30 + 40, // 40-70%
        memory: Math.random() * 20 + 60, // 60-80%
        disk: Math.random() * 15 + 30, // 30-45%
        bandwidth: Math.random() * 40 + 20, // 20-60%
      },
      coreWebVitals,
    }

    // Track performance check
    unifiedAnalytics.track({
      name: 'performance_dashboard_viewed',
      properties: {
        time_range: range,
        page_load_avg: pageLoadAvg,
        error_rate: performanceData.errorRate.current,
        cache_hit_rate: cacheHitAvg,
      }
    })

    return NextResponse.json(performanceData)
  } catch (error) {
    console.error('Error fetching performance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}