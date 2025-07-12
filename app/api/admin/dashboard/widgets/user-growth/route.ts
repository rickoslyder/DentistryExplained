import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { format, subDays, startOfMonth, subMonths } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const timeframe = searchParams.get('timeframe') || 'daily'

    // Use optimized function for daily stats
    if (timeframe === 'daily') {
      const { data: growthData, error } = await supabase
        .rpc('get_user_growth_stats', { days: 30 })
        .single()

      if (error) {
        console.error('Error fetching user growth:', error)
        return fetchGrowthManually(supabase, timeframe)
      }

      // Transform the data for the chart
      const chartData = growthData.daily.map((day: any) => ({
        date: format(new Date(day.date), 'MMM d'),
        fullDate: day.date,
        patients: day.patients,
        professionals: day.professionals,
        total: day.total
      }))

      return NextResponse.json({
        chartData,
        summary: {
          totalUsers: growthData.summary.total_users,
          totalPatients: growthData.summary.total_patients,
          totalProfessionals: growthData.summary.total_professionals,
          avgDailyGrowth: growthData.summary.avg_daily_patients + growthData.summary.avg_daily_professionals,
          patientPercentage: growthData.summary.total_users > 0 
            ? ((growthData.summary.total_patients / growthData.summary.total_users) * 100).toFixed(1)
            : '0',
          professionalPercentage: growthData.summary.total_users > 0
            ? ((growthData.summary.total_professionals / growthData.summary.total_users) * 100).toFixed(1)
            : '0'
        }
      })
    }

    // For weekly and monthly, we'll use aggregated queries
    if (timeframe === 'weekly' || timeframe === 'monthly') {
      const interval = timeframe === 'weekly' ? '7 days' : '1 month'
      const periods = timeframe === 'weekly' ? 12 : 12
      
      const { data: aggregatedData, error } = await supabase.rpc('get_user_growth_by_period', {
        period_interval: interval,
        num_periods: periods
      })

      if (error || !aggregatedData) {
        return fetchGrowthManually(supabase, timeframe)
      }

      const chartData = aggregatedData.map((period: any) => ({
        date: timeframe === 'weekly' 
          ? `Week of ${format(new Date(period.period_start), 'MMM d')}`
          : format(new Date(period.period_start), 'MMM yyyy'),
        fullDate: period.period_start,
        patients: period.patients,
        professionals: period.professionals,
        total: period.total
      }))

      const totalUsers = aggregatedData.reduce((sum: number, p: any) => sum + p.total, 0)
      const totalPatients = aggregatedData.reduce((sum: number, p: any) => sum + p.patients, 0)
      const totalProfessionals = aggregatedData.reduce((sum: number, p: any) => sum + p.professionals, 0)

      return NextResponse.json({
        chartData,
        summary: {
          totalUsers,
          totalPatients,
          totalProfessionals,
          avgGrowth: totalUsers / periods,
          patientPercentage: totalUsers > 0 ? ((totalPatients / totalUsers) * 100).toFixed(1) : '0',
          professionalPercentage: totalUsers > 0 ? ((totalProfessionals / totalUsers) * 100).toFixed(1) : '0'
        }
      })
    }

    return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 })
  } catch (error) {
    console.error('User growth error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user growth data' },
      { status: 500 }
    )
  }
}

// Fallback function if RPC doesn't exist
async function fetchGrowthManually(supabase: any, timeframe: string) {
  const chartData = []
  const periods = timeframe === 'daily' ? 30 : timeframe === 'weekly' ? 12 : 12

  if (timeframe === 'daily') {
    for (let i = periods - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const startOfDay = new Date(date.setHours(0, 0, 0, 0))
      const endOfDay = new Date(date.setHours(23, 59, 59, 999))

      const { data } = await supabase
        .from('profiles')
        .select('user_type')
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString())

      const patients = data?.filter(u => u.user_type === 'patient').length || 0
      const professionals = data?.filter(u => u.user_type === 'professional').length || 0

      chartData.push({
        date: format(date, 'MMM d'),
        fullDate: format(date, 'yyyy-MM-dd'),
        patients,
        professionals,
        total: patients + professionals
      })
    }
  }

  return NextResponse.json({
    chartData,
    summary: {
      totalUsers: chartData.reduce((sum, d) => sum + d.total, 0),
      totalPatients: chartData.reduce((sum, d) => sum + d.patients, 0),
      totalProfessionals: chartData.reduce((sum, d) => sum + d.professionals, 0),
      avgDailyGrowth: chartData.reduce((sum, d) => sum + d.total, 0) / periods,
      patientPercentage: '0',
      professionalPercentage: '0'
    }
  })
}