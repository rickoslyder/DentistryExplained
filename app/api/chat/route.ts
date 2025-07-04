import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createRouteSupabaseClient, getCurrentUserProfile } from '@/lib/supabase-auth'
import { generateId } from '@/lib/utils'
import { generateAIResponse } from '@/lib/litellm'

export async function POST(request: NextRequest) {
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

    const { message, sessionId, pageContext } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Create authenticated Supabase client
    const supabase = await createRouteSupabaseClient()

    // Get or create chat session
    let chatSession
    if (sessionId) {
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userProfile.id)
        .single()

      if (existingSession) {
        chatSession = existingSession
        
        // Update last activity
        await supabase
          .from('chat_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', existingSession.id)
      }
    }

    if (!chatSession) {
      // Create new session
      const newSessionId = generateId()
      const { data: newSession, error } = await supabase
        .from('chat_sessions')
        .insert([
          {
            user_id: userProfile.id,
            session_id: newSessionId,
            page_context: pageContext,
          },
        ])
        .select()
        .single()

      if (error) {
        throw error
      }

      chatSession = newSession
    }

    // Save user message
    const { data: userMsg } = await supabase
      .from('chat_messages')
      .insert([
        {
          session_id: chatSession.id,
          role: 'user',
          content: message,
        },
      ])
      .select()
      .single()

    // Get recent chat history for context
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', chatSession.id)
      .order('created_at', { ascending: true })
      .limit(10)

    // Generate AI response using LiteLLM
    const aiResponse = await generateAIResponse(message, chatHistory || [], pageContext)

    // Save AI response
    const { data: aiMsg } = await supabase
      .from('chat_messages')
      .insert([
        {
          session_id: chatSession.id,
          role: 'assistant',
          content: aiResponse,
        },
      ])
      .select()
      .single()

    return NextResponse.json({
      response: aiResponse,
      sessionId: chatSession.session_id,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


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

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Create authenticated Supabase client
    const supabase = await createRouteSupabaseClient()

    // Get chat history
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userProfile.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      session,
      messages: messages || [],
    })
  } catch (error) {
    console.error('Chat history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}