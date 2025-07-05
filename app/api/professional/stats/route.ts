import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'
import { mapDatabaseError } from '@/lib/api-errors'
import { supabaseAdmin } from '@/lib/supabase'

const getProfessionalStatsHandler = withAuth(async (request: NextRequest, context) => {
  const { userProfile } = context

  // Check if user is professional
  if (userProfile.userType !== 'professional') {
    return NextResponse.json(
      { error: 'Access denied. Professional account required.' },
      { status: 403 }
    )
  }

  try {
    // Get download stats using the database function
    const { data: downloadStats, error: statsError } = await supabaseAdmin.rpc('get_download_stats', {
      p_user_id: userProfile.id
    })

    if (statsError) {
      console.error('Failed to fetch download stats:', statsError)
      return mapDatabaseError(statsError, 'fetch_download_stats', context.requestId)
    }

    const stats = downloadStats?.[0] || {
      total_downloads: 0,
      downloads_this_month: 0,
      recent_downloads: []
    }

    // Get verification status
    const { data: verification } = await supabaseAdmin
      .from('professional_verifications')
      .select('status, verification_date, expiry_date')
      .eq('user_id', userProfile.id)
      .single()

    // Get practice listing if exists
    const { data: practice } = await supabaseAdmin
      .from('practice_listings')
      .select('id, name')
      .eq('claimed_by', userProfile.id)
      .single()

    // For practice views, we'll need to implement tracking later
    // For now, return 0 or a placeholder
    const practiceViews = practice ? 0 : 0

    // Format recent downloads
    const recentDownloads = stats.recent_downloads || []
    const formattedDownloads = recentDownloads.map((download: any) => ({
      name: download.resource_name,
      type: download.resource_type,
      downloadedAt: download.downloaded_at,
      timeAgo: getTimeAgo(new Date(download.downloaded_at))
    }))

    return NextResponse.json({
      downloadsThisMonth: stats.downloads_this_month || 0,
      totalDownloads: stats.total_downloads || 0,
      verificationStatus: verification?.status || 'pending',
      verifiedSince: verification?.verification_date || null,
      expiryDate: verification?.expiry_date || null,
      practiceViews,
      recentDownloads: formattedDownloads.slice(0, 5),
      hasPracticeListing: !!practice,
      practiceName: practice?.name || null
    })
  } catch (error) {
    console.error('Unexpected error in professional stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch professional statistics' },
      { status: 500 }
    )
  }
})

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " years ago"
  
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " months ago"
  
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " days ago"
  
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " hours ago"
  
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " minutes ago"
  
  return "just now"
}

export const GET = getProfessionalStatsHandler