import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a service role client for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

// Vercel Cron Jobs require authorization
function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return false
  }
  return true
}

export async function GET(request: NextRequest) {
  // Check authorization
  if (process.env.NODE_ENV === 'production' && !isAuthorized(request)) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    console.log('[Cron] Starting scheduled article publishing...')
    
    // Call the Supabase function to publish scheduled articles
    const { data, error } = await supabase.rpc('publish_scheduled_articles')
    
    if (error) {
      console.error('[Cron] Error publishing scheduled articles:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          details: error 
        },
        { status: 500 }
      )
    }
    
    const results = data || []
    const published = results.filter((r: any) => r.published).length
    const failed = results.filter((r: any) => !r.published).length
    
    console.log(`[Cron] Published ${published} articles, ${failed} failed`)
    
    // Log details for debugging
    if (results.length > 0) {
      console.log('[Cron] Publishing results:', JSON.stringify(results, null, 2))
    }
    
    return NextResponse.json({
      success: true,
      message: `Published ${published} articles, ${failed} failed`,
      results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Cron] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request)
}