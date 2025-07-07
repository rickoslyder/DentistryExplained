import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { mapDatabaseError } from '@/lib/api-errors'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

const getPerformanceMetricsHandler = withAuth(async (request: NextRequest, context) => {
  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get('range') || '1h'
  
  try {
    const supabase = await createServerSupabaseClient()
    
    // Calculate time window based on range
    let hoursAgo = 1
    switch (timeRange) {
      case '1h': hoursAgo = 1; break
      case '6h': hoursAgo = 6; break
      case '24h': hoursAgo = 24; break
      case '7d': hoursAgo = 168; break
    }
    
    const startTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
    
    // Get API performance metrics from activity logs
    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select('action, resource_type, metadata, created_at')
      .gte('created_at', startTime)
      .in('action', ['api_request', 'api_response'])
      .order('created_at', { ascending: false })
    
    if (error) {
      return mapDatabaseError(error, 'fetch_performance_metrics', context.requestId)
    }
    
    // Process logs to calculate metrics
    const endpointMetrics: Record<string, any> = {}
    const timeSeriesData: any[] = []
    
    // Group by endpoint
    logs?.forEach(log => {
      const endpoint = log.metadata?.endpoint || log.resource_type
      const responseTime = log.metadata?.response_time || 0
      const method = log.metadata?.method || 'GET'
      const status = log.metadata?.status || 200
      
      if (!endpointMetrics[endpoint]) {
        endpointMetrics[endpoint] = {
          endpoint,
          method,
          response_times: [],
          request_count: 0,
          error_count: 0,
        }
      }
      
      endpointMetrics[endpoint].request_count++
      if (responseTime > 0) {
        endpointMetrics[endpoint].response_times.push(responseTime)
      }
      if (status >= 400) {
        endpointMetrics[endpoint].error_count++
      }
      
      // Add to time series
      timeSeriesData.push({
        time: log.created_at,
        endpoint,
        response_time: responseTime,
        status
      })
    })
    
    // Calculate aggregated metrics
    const metrics = Object.values(endpointMetrics).map((metric: any) => {
      const responseTimes = metric.response_times
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length 
        : 0
      
      return {
        endpoint: metric.endpoint,
        method: metric.method,
        avg_response_time: Math.round(avgResponseTime),
        min_response_time: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
        max_response_time: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
        request_count: metric.request_count,
        error_count: metric.error_count,
        error_rate: metric.request_count > 0 
          ? Math.round((metric.error_count / metric.request_count) * 10000) / 100 
          : 0
      }
    })
    
    // Sort by request count
    metrics.sort((a, b) => b.request_count - a.request_count)
    
    return NextResponse.json({
      metrics: metrics.slice(0, 10), // Top 10 endpoints
      timeSeries: timeSeriesData.slice(0, 100), // Last 100 data points
      timeRange
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      }
    })
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    )
  }
}, { requireRole: 'admin' })

export const GET = getPerformanceMetricsHandler

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}