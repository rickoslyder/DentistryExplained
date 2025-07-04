import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { supabaseAdmin } from '@/lib/supabase'

// Schema for saving assistant message
const saveMessageSchema = z.object({
  sessionId: z.string(),
  content: z.string().min(1),
  role: z.enum(['assistant', 'user']).default('assistant'),
  metadata: z.record(z.any()).optional(),
})

const saveMessageHandler = compose(
  withRateLimit(60000, 100), // 100 requests per minute
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const body = await request.json()
    const params = saveMessageSchema.parse(body)
    const { sessionId, content, role, metadata } = params
    const { userProfile } = context
    
    // Use admin client to bypass RLS
    const supabase = supabaseAdmin

    // Verify session belongs to user
    const { data: chatSession, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('id, user_id')
      .eq('session_id', sessionId)
      .eq('user_id', userProfile.id)
      .single()

    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        return ApiErrors.notFound('Chat session', requestId)
      }
      return ApiErrors.fromDatabaseError(sessionError, 'verify_session', requestId)
    }

    // Store the message
    const { data: message, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: chatSession.id,
        role,
        content,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (insertError) {
      return ApiErrors.fromDatabaseError(insertError, 'store_message', requestId)
    }

    return NextResponse.json({
      success: true,
      messageId: message.id
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.fromValidationError(error, requestId)
    }
    return ApiErrors.internal(error, 'save_message', requestId)
  }
})

export const POST = saveMessageHandler