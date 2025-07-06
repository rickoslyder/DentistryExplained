import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths, format } from 'date-fns'

const getUserGrowthHandler = compose(
  withRateLimit(60000, 100),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const supabase = context.supabase!
    const now = new Date()
    
    // Get all users with their registration dates and types
    const { data: users, error } = await supabase
      .from('profiles')
      .select('created_at, user_type')
      .order('created_at', { ascending: true })
    
    if (error) {
      return ApiErrors.fromDatabaseError(error, 'get_user_growth', requestId)
    }
    
    // Process daily data (last 30 days)
    const dailyData = []
    for (let i = 29; i >= 0; i--) {
      const date = startOfDay(subDays(now, i))
      const nextDate = startOfDay(subDays(now, i - 1))
      
      const dayUsers = users?.filter(u => {
        const createdAt = new Date(u.created_at)
        return createdAt >= date && createdAt < nextDate
      }) || []
      
      const patients = dayUsers.filter(u => u.user_type === 'patient').length
      const professionals = dayUsers.filter(u => u.user_type === 'professional').length
      
      dailyData.push({
        date: format(date, 'yyyy-MM-dd'),
        patients,
        professionals,
        total: patients + professionals,
      })
    }
    
    // Process weekly data (last 12 weeks)
    const weeklyData = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i))
      const weekEnd = startOfWeek(subWeeks(now, i - 1))
      
      const weekUsers = users?.filter(u => {
        const createdAt = new Date(u.created_at)
        return createdAt >= weekStart && createdAt < weekEnd
      }) || []
      
      const patients = weekUsers.filter(u => u.user_type === 'patient').length
      const professionals = weekUsers.filter(u => u.user_type === 'professional').length
      
      weeklyData.push({
        date: format(weekStart, 'yyyy-MM-dd'),
        patients,
        professionals,
        total: patients + professionals,
      })
    }
    
    // Process monthly data (last 12 months)
    const monthlyData = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = startOfMonth(subMonths(now, i - 1))
      
      const monthUsers = users?.filter(u => {
        const createdAt = new Date(u.created_at)
        return createdAt >= monthStart && createdAt < monthEnd
      }) || []
      
      const patients = monthUsers.filter(u => u.user_type === 'patient').length
      const professionals = monthUsers.filter(u => u.user_type === 'professional').length
      
      monthlyData.push({
        date: format(monthStart, 'yyyy-MM-dd'),
        patients,
        professionals,
        total: patients + professionals,
      })
    }
    
    // Calculate stats
    const totalUsers = users?.length || 0
    const lastMonthUsers = users?.filter(u => 
      new Date(u.created_at) >= subDays(now, 30)
    ).length || 0
    const previousMonthUsers = users?.filter(u => {
      const createdAt = new Date(u.created_at)
      return createdAt >= subDays(now, 60) && createdAt < subDays(now, 30)
    }).length || 0
    
    const growthRate = previousMonthUsers > 0
      ? Math.round(((lastMonthUsers - previousMonthUsers) / previousMonthUsers) * 100)
      : 100
    
    // Simple linear projection for next 30 days
    const avgDailyGrowth = lastMonthUsers / 30
    const projection = Math.round(totalUsers + (avgDailyGrowth * 30))
    
    return NextResponse.json({
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
      stats: {
        totalUsers,
        growthRate,
        projection,
      },
    })
  } catch (error) {
    return ApiErrors.internal(error, 'get_user_growth', requestId)
  }
})

export const GET = getUserGrowthHandler