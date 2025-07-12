import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ModerationAggregator, ReviewQueue } from '@/lib/moderation'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Check if user has admin/moderator permissions

    const searchParams = request.nextUrl.searchParams
    const timeframe = searchParams.get('timeframe') || 'day'

    // Get queue stats
    const queueStats = await ReviewQueue.getQueueStats()

    // Get moderation stats
    const moderationStats = await ModerationAggregator.getStats(timeframe as any)

    // Get today's stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: todayStats } = await supabase
      .from('moderation_logs')
      .select('action')
      .gte('created_at', today.toISOString())

    const approvedToday = todayStats?.filter(log => log.action === 'approve').length || 0
    const rejectedToday = todayStats?.filter(log => log.action === 'reject').length || 0

    // Get hourly activity for today
    const { data: hourlyData } = await supabase
      .from('moderation_logs')
      .select('created_at')
      .gte('created_at', today.toISOString())

    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: 0
    }))

    hourlyData?.forEach(log => {
      const hour = new Date(log.created_at).getHours()
      hourlyActivity[hour].count++
    })

    // Get daily trends for the timeframe
    const daysAgo = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 1
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    startDate.setHours(0, 0, 0, 0)

    const { data: dailyData } = await supabase
      .from('moderation_logs')
      .select('created_at, action')
      .gte('created_at', startDate.toISOString())

    const dailyTrends: Record<string, { date: string; total: number; rejected: number }> = {}

    dailyData?.forEach(log => {
      const date = new Date(log.created_at).toISOString().split('T')[0]
      if (!dailyTrends[date]) {
        dailyTrends[date] = { date, total: 0, rejected: 0 }
      }
      dailyTrends[date].total++
      if (log.action === 'reject') {
        dailyTrends[date].rejected++
      }
    })

    const trends = {
      hourly: timeframe === 'day' ? hourlyActivity : undefined,
      daily: timeframe !== 'day' ? Object.values(dailyTrends).sort((a, b) => 
        a.date.localeCompare(b.date)
      ) : undefined
    }

    return NextResponse.json({
      ...queueStats,
      ...moderationStats,
      approvedToday,
      rejectedToday,
      trends
    })
  } catch (error) {
    console.error('Failed to get moderation stats:', error)
    return NextResponse.json(
      { error: 'Failed to get moderation stats' },
      { status: 500 }
    )
  }
}