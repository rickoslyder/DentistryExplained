import { NextRequest, NextResponse } from 'next/server'
import { ApiErrors, mapDatabaseError } from '@/lib/api-errors'
import { withAuth } from '@/lib/api-middleware'

const getSessionsHandler = withAuth(async (request: NextRequest, context) => {
  const { userProfile, supabase } = context

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
    return mapDatabaseError(error)
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
      preview: firstUserMessage?.content?.substring(0, 100) || 'New conversation',
    }
  }) || []

  return NextResponse.json({
    sessions: processedSessions,
    total: processedSessions.length,
    requestId: context.requestId,
  })
})

export const GET = getSessionsHandler