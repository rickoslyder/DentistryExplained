import { NextRequest, NextResponse } from 'next/server'
import { generateId } from '@/lib/utils'
import { generateAIResponse, UserContext } from '@/lib/litellm'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { withAuth, withBodyLimit, withRateLimit, withCORS, compose } from '@/lib/api-middleware'
import { rateLimiters } from '@/lib/rate-limiter'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { currentUser } from '@clerk/nextjs/server'
import { serverAnalytics } from '@/lib/analytics-server'

// Schema for chat message
const chatMessageSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().nullable().optional(),
  pageContext: z.object({
    title: z.string().optional(),
    url: z.string().optional(),
    category: z.string().optional(),
    content: z.string().optional(),
    glossaryTerm: z.object({
      term: z.string(),
      definition: z.string(),
      pronunciation: z.string().nullable().optional(),
      alsoKnownAs: z.array(z.string()).nullable().optional(),
      relatedTerms: z.array(z.string()).nullable().optional(),
      category: z.string().nullable().optional(),
      difficulty: z.string().nullable().optional(),
      example: z.string().nullable().optional()
    }).optional()
  }).optional(),
  glossaryContext: z.object({
    term: z.string(),
    definition: z.string(),
    pronunciation: z.string().nullable().optional(),
    alsoKnownAs: z.array(z.string()).nullable().optional(),
    relatedTerms: z.array(z.string()).nullable().optional(),
    category: z.string().nullable().optional(),
    difficulty: z.string().nullable().optional(),
    example: z.string().nullable().optional()
  }).optional(),
  webSearchEnabled: z.boolean().optional().default(false),
  webSearchType: z.enum(['smart', 'news', 'research', 'nhs']).optional().default('smart'),
  stream: z.boolean().optional().default(false)
})

const chatHandler = compose(
  withBodyLimit(1024 * 50), // 50KB limit
  withCORS(),
  withAuth
)(async (request: NextRequest, context) => {
  // Apply chat-specific rate limiting
  return await rateLimiters.chat(request, async () => {
    const requestId = getRequestId(request)
    
    try {
    const body = await request.json()
    
    // Validate request body
    const params = chatMessageSchema.parse(body)
    const { message, sessionId, pageContext, glossaryContext, webSearchEnabled, webSearchType, stream } = params
    const { userProfile } = context
    // Use admin client to bypass RLS for chat operations
    const supabase = supabaseAdmin

    // Get or create chat session
    let chatSession
    if (sessionId) {
      const { data: existingSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userProfile.id)
        .single()

      if (sessionError && sessionError.code !== 'PGRST116') {
        return ApiErrors.fromDatabaseError(sessionError, 'fetch_session', requestId)
      }

      chatSession = existingSession
    }

    // Create new session if needed
    if (!chatSession) {
      const newSessionId = sessionId || generateId()
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          session_id: newSessionId,
          user_id: userProfile.id,
          page_context: pageContext || {},
          expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 180 days
        })
        .select()
        .single()

      if (createError) {
        return ApiErrors.fromDatabaseError(createError, 'create_session', requestId)
      }

      chatSession = newSession
    }

    // Get recent messages for context (BEFORE storing the current message)
    const { data: recentMessages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', chatSession.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (messagesError) {
      return ApiErrors.fromDatabaseError(messagesError, 'fetch_messages', requestId)
    }

    // Store user message (AFTER fetching history to avoid duplication)
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: chatSession.id,
        role: 'user',
        content: message,
        metadata: { pageContext }
      })

    if (insertError) {
      return ApiErrors.fromDatabaseError(insertError, 'store_user_message', requestId)
    }

    // Build conversation history (without current message)
    const conversationHistory = recentMessages
      ?.reverse()
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })) || []

    // Log conversation history for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Chat ${requestId}] Session details:`, {
        sessionId: chatSession.session_id,
        dbSessionId: chatSession.id,
        userId: userProfile.id,
        isNewSession: !sessionId
      })
      
      console.log(`[Chat ${requestId}] Message flow:`, {
        recentMessagesCount: recentMessages?.length || 0,
        historyLength: conversationHistory.length,
        messages: conversationHistory.map(msg => ({
          role: msg.role,
          preview: msg.content.substring(0, 50) + '...'
        })),
        currentMessage: {
          role: 'user',
          preview: message.substring(0, 50) + '...'
        },
        streamingEnabled: stream
      })
    }

    // Track chat session creation (server-side)
    if (!sessionId) {
      serverAnalytics.trackChatSession(
        'created',
        chatSession.session_id,
        userProfile.id
      ).catch(err => console.error('[Analytics] Failed to track chat session:', err))
    }

    // Don't add current message here - it will be added in generateAIResponse

    // Get user preferences from Clerk
    const clerkUser = await currentUser()
    const userPreferences = clerkUser?.unsafeMetadata?.settings?.aiAssistant
    
    // Build user context for AI
    const userContext: UserContext = {
      user_type: userProfile.user_type,
      preferences: userPreferences ? {
        responseStyle: userPreferences.responseStyle || 'concise',
        complexityLevel: userPreferences.complexityLevel || 'basic',
        includeCosts: userPreferences.includeCosts || false,
        autoSuggestFollowUp: userPreferences.autoSuggestFollowUp !== false
      } : undefined,
      glossaryContext,
      webSearchEnabled,
      webSearchType
    }

    // Generate AI response with web search
    try {
      const aiResponse = await generateAIResponse(
        message,
        conversationHistory, // Pass the conversation history without the current message
        pageContext,
        stream,
        userContext,
        { userId: userProfile.id, sessionId: chatSession.id }
      )

      // Handle streaming response
      if (stream && aiResponse instanceof ReadableStream) {
        // Assistant messages are saved after streaming completes via the /api/chat/messages endpoint
        // This is handled in the use-chat-stream hook
        return new NextResponse(aiResponse, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Session-Id': chatSession.session_id,
          },
        })
      }

      // Handle non-streaming response
      if (typeof aiResponse === 'string') {
        // Legacy string response
        const responseContent = aiResponse
        supabase
          .from('chat_messages')
          .insert({
            session_id: chatSession.id,
            role: 'assistant',
            content: responseContent
          })
          .then(({ error }) => {
            if (error) {
              console.error(`[Chat ${requestId}] Failed to store assistant message:`, error)
            }
          })

        return NextResponse.json({
          response: responseContent,
          sessionId: chatSession.session_id
        }, {
          headers: {
            'X-Session-Id': chatSession.session_id
          }
        })
      } else if ('content' in aiResponse) {
        // Response with search metadata
        const { content, searchResults, citations } = aiResponse
        
        // Store assistant message with metadata
        supabase
          .from('chat_messages')
          .insert({
            session_id: chatSession.id,
            role: 'assistant',
            content,
            metadata: { searchResults, citations }
          })
          .then(({ error }) => {
            if (error) {
              console.error(`[Chat ${requestId}] Failed to store assistant message:`, error)
            }
          })

        return NextResponse.json({
          response: content,
          sessionId: chatSession.session_id,
          searchResults,
          citations
        }, {
          headers: {
            'X-Session-Id': chatSession.session_id
          }
        })
      }
    } catch (error: any) {
      // Handle LiteLLM specific errors
      if (error.status === 429) {
        return ApiErrors.rateLimit(60, requestId)
      }
      
      return ApiErrors.fromExternalError('LiteLLM', error, requestId)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.fromValidationError(error, requestId)
    }
    return ApiErrors.internal(error, 'chat', requestId)
  }
  })
})

export const POST = chatHandler

// GET endpoint for retrieving chat history
const getChatHistoryHandler = compose(
  withRateLimit(60000, 100),
  withCORS(),
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const { userProfile } = context
    // Use admin client to bypass RLS
    const supabase = supabaseAdmin
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return ApiErrors.badRequest('Session ID is required', undefined, requestId)
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, session_id')
      .eq('session_id', sessionId)
      .eq('user_id', userProfile.id)
      .single()

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        return ApiErrors.notFound('Chat session', requestId)
      }
      return ApiErrors.fromDatabaseError(sessionError, 'verify_session', requestId)
    }

    // Get messages - use the UUID id, not the text session_id
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })

    if (messagesError) {
      return ApiErrors.fromDatabaseError(messagesError, 'fetch_messages', requestId)
    }

    return NextResponse.json({
      sessionId: session.session_id,
      messages: messages || []
    })
  } catch (error) {
    return ApiErrors.internal(error, 'get_chat_history', requestId)
  }
})

export const GET = getChatHistoryHandler