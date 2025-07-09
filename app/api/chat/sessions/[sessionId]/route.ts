import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createRouteSupabaseClient, getCurrentUserProfile } from '@/lib/supabase-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's profile to get their database ID
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const { sessionId } = params

    // Create authenticated Supabase client
    const supabase = await createRouteSupabaseClient()

    // First verify the session belongs to the user
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userProfile.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Delete all messages in the session first (due to foreign key constraints)
    const { error: messagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', session.id)

    if (messagesError) {
      throw messagesError
    }

    // Then delete the session
    const { error: sessionError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', session.id)

    if (sessionError) {
      throw sessionError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete chat session error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}