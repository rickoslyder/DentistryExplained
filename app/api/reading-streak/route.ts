import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { mapDatabaseError } from '@/lib/api-errors'
import { supabaseAdmin } from '@/lib/supabase'

const getReadingStreakHandler = withAuth(async (request: NextRequest, context) => {
  const { userProfile } = context

  try {
    // Get reading history for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: readingHistory, error } = await supabaseAdmin
      .from('reading_history')
      .select('last_read_at')
      .eq('user_id', userProfile.id)
      .gte('last_read_at', thirtyDaysAgo.toISOString())
      .order('last_read_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch reading history:', error)
      return mapDatabaseError(error, 'fetch_reading_history', context.requestId)
    }

    // Calculate streak
    let currentStreak = 0
    let todayRead = false
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (readingHistory && readingHistory.length > 0) {
      // Group by date
      const readingDates = new Set(
        readingHistory.map(item => {
          const date = new Date(item.last_read_at)
          date.setHours(0, 0, 0, 0)
          return date.getTime()
        })
      )

      // Check if read today
      todayRead = readingDates.has(today.getTime())

      // Calculate streak
      const checkDate = new Date(today)
      if (!todayRead) {
        checkDate.setDate(checkDate.getDate() - 1) // Start from yesterday if not read today
      }

      while (readingDates.has(checkDate.getTime())) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }

    // Get week activity (last 7 days)
    const weekActivity: boolean[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const hasActivity = readingHistory?.some(item => {
        const readDate = new Date(item.last_read_at)
        readDate.setHours(0, 0, 0, 0)
        return readDate.getTime() === date.getTime()
      }) || false
      
      weekActivity.push(hasActivity)
    }

    // Get total reading days
    const uniqueReadingDays = new Set(
      readingHistory?.map(item => {
        const date = new Date(item.last_read_at)
        date.setHours(0, 0, 0, 0)
        return date.getTime()
      }) || []
    )

    return NextResponse.json({
      currentStreak,
      todayRead,
      weekActivity,
      totalReadingDays: uniqueReadingDays.size,
      longestStreak: currentStreak // For now, we'll just use current streak
    })
  } catch (error) {
    console.error('Unexpected error in reading streak:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading streak' },
      { status: 500 }
    )
  }
})

export const GET = getReadingStreakHandler