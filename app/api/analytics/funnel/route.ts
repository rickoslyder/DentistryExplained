import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7')
    
    const supabase = await createServerSupabaseClient()
    const startDate = startOfDay(subDays(new Date(), days - 1))
    const endDate = endOfDay(new Date())

    // Fetch funnel data
    const [
      totalUsers,
      signups,
      verifications,
      subscriptions
    ] = await Promise.all([
      // Total visitors (tracked via article views as proxy)
      supabase
        .from('article_views')
        .select('id')
        .gte('viewed_at', startDate.toISOString())
        .lte('viewed_at', endDate.toISOString()),

      // New signups
      supabase
        .from('profiles')
        .select('id, user_type')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),

      // Professional verifications
      supabase
        .from('professional_verifications')
        .select('id, status, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),

      // Active subscriptions (would need subscription table)
      // For now, we'll count approved professionals as active subscribers
      supabase
        .from('professional_verifications')
        .select('id')
        .eq('status', 'approved')
    ])

    const visitors = totalUsers.data?.length || 0
    const newSignups = signups.data?.length || 0
    const professionalSignups = signups.data?.filter(u => u.user_type === 'professional').length || 0
    
    const allVerifications = verifications.data || []
    const verificationStarted = allVerifications.length
    const verificationSubmitted = allVerifications.filter(v => v.status !== 'pending').length
    const verified = allVerifications.filter(v => v.status === 'approved').length
    const activeSubscribers = subscriptions.data?.length || 0

    return NextResponse.json({
      visitors,
      signups: newSignups,
      verificationStarted: professionalSignups, // Professionals who signed up
      verificationSubmitted,
      verified,
      activeSubscribers
    })
  } catch (error) {
    console.error('Failed to fetch funnel data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funnel data' },
      { status: 500 }
    )
  }
}