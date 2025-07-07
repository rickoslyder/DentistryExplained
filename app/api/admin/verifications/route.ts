import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('professional_verifications')
      .select(`
        *,
        user_profiles!professional_verifications_user_id_fkey(
          email,
          name
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('verification_status', status)
    }

    if (search) {
      query = query.or(`gdc_number.ilike.%${search}%,full_name.ilike.%${search}%,practice_name.ilike.%${search}%`)
    }

    const { data: verifications, error } = await query

    if (error) {
      console.error('Error fetching verifications:', error)
      return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 })
    }

    // Calculate stats
    const { data: statsData, error: statsError } = await supabase
      .from('professional_verifications')
      .select('verification_status')

    const stats = {
      total: statsData?.length || 0,
      pending: statsData?.filter(v => v.verification_status === 'pending').length || 0,
      verified: statsData?.filter(v => v.verification_status === 'verified').length || 0,
      rejected: statsData?.filter(v => v.verification_status === 'rejected').length || 0,
      expired: statsData?.filter(v => v.verification_status === 'expired').length || 0,
    }

    return NextResponse.json({ 
      verifications: verifications || [],
      stats 
    })
  } catch (error) {
    console.error('Admin verifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
