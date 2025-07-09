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

  // Process sessions to include message count and use title if available
  const processedSessions = sessions?.map(session => {
    const messages = session.chat_messages || []
    const firstUserMessage = messages.find((msg: any) => msg.role === 'user')
    
    return {
      id: session.session_id, // Use session_id for the chat history sidebar
      title: session.title || firstUserMessage?.content?.substring(0, 50) || 'New conversation',
      createdAt: session.created_at,
      lastActivity: session.last_activity || session.created_at,
      messageCount: messages.length,
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