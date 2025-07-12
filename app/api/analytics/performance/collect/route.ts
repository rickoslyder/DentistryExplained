import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function POST(request: NextRequest) {
  try {
    const { metrics } = await request.json()
    
    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json({ error: 'Invalid metrics data' }, { status: 400 })
    }

    // In production, you would:
    // 1. Validate the metrics data
    // 2. Store in a time-series database (InfluxDB, TimescaleDB)
    // 3. Aggregate for dashboards
    // 4. Set up alerts for anomalies
    
    // For now, we'll store aggregated data in Supabase
    const supabase = await createServerSupabaseClient()
    
    // Aggregate metrics by type
    const aggregated = metrics.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = []
      }
      acc[metric.type].push(metric.data)
      return acc
    }, {} as Record<string, any[]>)

    // Store performance snapshot
    const { error } = await supabase
      .from('performance_metrics')
      .insert({
        timestamp: new Date().toISOString(),
        url: metrics[0]?.url,
        metrics_summary: {
          lcp: aggregated.lcp?.[0]?.value,
          fid: aggregated.fid?.[0]?.value,
          cls: aggregated.cls?.[0]?.value,
          ttfb: aggregated.navigation?.[0]?.ttfb,
          page_load_time: aggregated.navigation?.[0]?.pageLoadTime,
          resource_count: aggregated.resource?.length || 0,
          long_tasks: aggregated.long_task?.length || 0,
        },
        raw_metrics: metrics,
      })

    if (error) {
      console.error('Error storing performance metrics:', error)
      // Don't fail the request - metrics are fire-and-forget
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error collecting performance metrics:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}