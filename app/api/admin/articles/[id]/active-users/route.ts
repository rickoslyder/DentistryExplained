import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await auth()
    if (!authResult || authResult.sessionClaims?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Get active users from Supabase presence
    const { data: presenceData } = await supabase
      .channel(`article-presence:${params.id}`)
      .presence()
      .get()

    // Transform presence data into user list
    const activeUsers = Object.values(presenceData || {}).flat().map((presence: any) => ({
      id: presence.user_id,
      status: presence.status || 'viewing',
      last_seen: presence.last_seen || new Date().toISOString()
    }))

    // Get user details
    if (activeUsers.length > 0) {
      const userIds = activeUsers.map(u => u.id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, image_url')
        .in('id', userIds)

      // Merge presence with profile data
      const usersWithProfiles = activeUsers.map(user => {
        const profile = profiles?.find(p => p.id === user.id)
        return {
          ...user,
          name: profile?.name || 'Unknown User',
          email: profile?.email || '',
          image_url: profile?.image_url
        }
      })

      return NextResponse.json(usersWithProfiles)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error('Error fetching active users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}