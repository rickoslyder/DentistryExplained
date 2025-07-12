import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { cacheManager, cacheMonitor } from '@/lib/cache'
import { ApiErrors } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider')
    const timeRange = searchParams.get('timeRange') || '1h' // 1h, 6h, 24h, 7d
    
    // Get detailed metrics from the monitor
    const metrics = await cacheMonitor.getMetrics()
    
    // Get provider-specific stats
    const providerStats = await cacheManager.stats()
    
    // Calculate time-based metrics
    const now = Date.now()
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }
    
    const cutoffTime = now - (timeRanges[timeRange as keyof typeof timeRanges] || timeRanges['1h'])
    
    // Filter metrics by time range
    const filteredMetrics = {
      operations: metrics.operations.filter(op => op.timestamp > cutoffTime),
      errors: metrics.errors.filter(err => err.timestamp > cutoffTime),
      performance: metrics.performance
    }
    
    // Calculate operation counts by type
    const operationCounts = filteredMetrics.operations.reduce((acc, op) => {
      acc[op.operation] = (acc[op.operation] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Calculate average response times by operation
    const responseTimes = filteredMetrics.operations.reduce((acc, op) => {
      if (!acc[op.operation]) {
        acc[op.operation] = { total: 0, count: 0 }
      }
      acc[op.operation].total += op.duration
      acc[op.operation].count += 1
      return acc
    }, {} as Record<string, { total: number; count: number }>)
    
    const avgResponseTimes = Object.entries(responseTimes).reduce((acc, [op, data]) => {
      acc[op] = Math.round(data.total / data.count)
      return acc
    }, {} as Record<string, number>)
    
    // Calculate error rate
    const totalOperations = filteredMetrics.operations.length
    const totalErrors = filteredMetrics.errors.length
    const errorRate = totalOperations > 0 ? (totalErrors / totalOperations) * 100 : 0
    
    // Get provider-specific detailed metrics
    let providerDetails = null
    if (provider && providerStats[provider]) {
      const specificProvider = cacheManager.getProvider(provider)
      if (specificProvider) {
        providerDetails = {
          stats: providerStats[provider],
          operations: filteredMetrics.operations.filter(op => op.provider === provider),
          errors: filteredMetrics.errors.filter(err => err.provider === provider),
          health: await specificProvider.isHealthy()
        }
      }
    }
    
    return NextResponse.json({
      timeRange,
      summary: {
        totalOperations,
        totalErrors,
        errorRate: errorRate.toFixed(2) + '%',
        providers: Object.keys(providerStats),
        health: await cacheManager.isHealthy()
      },
      operations: {
        counts: operationCounts,
        responseTimes: avgResponseTimes,
        recent: filteredMetrics.operations.slice(-20) // Last 20 operations
      },
      errors: {
        count: totalErrors,
        recent: filteredMetrics.errors.slice(-10), // Last 10 errors
        byType: filteredMetrics.errors.reduce((acc, err) => {
          acc[err.error] = (acc[err.error] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      },
      providers: providerStats,
      providerDetails,
      performance: {
        current: filteredMetrics.performance,
        historical: {
          // This would typically come from a time-series database
          // For now, we'll just show current stats
          avgResponseTime: avgResponseTimes,
          operationsPerMinute: Math.round((totalOperations / (timeRanges[timeRange as keyof typeof timeRanges] || timeRanges['1h'])) * 60 * 1000)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching cache metrics:', error)
    return ApiErrors.internalError('cache-metrics', error)
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}