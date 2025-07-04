import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createRouteSupabaseClient, getCurrentUserProfile } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's profile to get their database ID
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Create authenticated Supabase client
    const supabase = await createRouteSupabaseClient()

    // Get all chat sessions for the user with message counts
    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select(`
        *,
        chat_messages!inner(
          id,
          content,
          role,
          created_at
        )
      `)
      .eq('user_id', userProfile.id)
      .order('last_activity', { ascending: false })

    if (error) {
      throw error
    }

    // Process sessions to include message count and preview
    const processedSessions = sessions?.map(session => {
      const messages = session.chat_messages || []
      const firstUserMessage = messages.find((msg: any) => msg.role === 'user')
      
      return {
        id: session.id,
        session_id: session.session_id,
        created_at: session.created_at,
        last_activity: session.last_activity,
        page_context: session.page_context,
        message_count: messages.length,
        preview: firstUserMessage?.content || 'New conversation',
      }
    }) || []

    return NextResponse.json({
      sessions: processedSessions,
    })
  } catch (error) {
    console.error('Chat sessions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}