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
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', user.id)
      .single()

    if (error || !profile || !['admin', 'editor'].includes(profile.role || '')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ isAdmin: true })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}