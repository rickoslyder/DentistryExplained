import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { z } from 'zod'
import { withRateLimit, compose } from '@/lib/api-middleware'
import { liteLLMConfig } from '@/lib/config/litellm'

// Schema for request validation
const generateTitleSchema = z.object({
  sessionId: z.string().max(100),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(5000) // Limit content length
  })).min(2).max(10) // Need at least user message and AI response, max 10 messages
})

const generateTitleHandler = compose(
  withRateLimit(60000, 10) // 10 title generations per minute
)(async (request: NextRequest) => {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { sessionId, messages } = generateTitleSchema.parse(body)

    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Verify session belongs to user
    const { data: session } = await supabaseAdmin
      .from('chat_sessions')
      .select('id, title')
      .eq('session_id', sessionId)
      .eq('user_id', profile.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // If title already exists, return it
    if (session.title) {
      return NextResponse.json({ title: session.title })
    }

    // Generate title using LiteLLM
    const prompt = `Generate a concise, descriptive title (3-7 words) for this dental health conversation. 
Focus on the main topic or question. Do not include quotes or punctuation.

User: ${messages[0].content}
Assistant: ${messages[1].content.substring(0, 200)}...

Title:`

    try {
      // Call LiteLLM API directly
      const response = await fetch(liteLLMConfig.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${liteLLMConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: liteLLMConfig.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 20,
          temperature: 0.3,
        }),
      })

      if (!response.ok) {
        throw new Error(`LiteLLM API error: ${response.status}`)
      }

      const data = await response.json()
      const title = data.choices[0]?.message?.content?.trim() || 'New conversation'
      
      // Clean up and sanitize the title
      const cleanTitle = title
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/^Title:\s*/i, '') // Remove "Title:" prefix if present
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
        .trim()
        .substring(0, 100) // Limit length

      // Update session with generated title
      const { error: updateError } = await supabaseAdmin
        .from('chat_sessions')
        .update({ title: cleanTitle })
        .eq('id', session.id)

      if (updateError) {
        console.error('Failed to update session title:', updateError)
        // Don't fail the request, just return the generated title
      }

      return NextResponse.json({ title: cleanTitle })
    } catch (llmError) {
      console.error('LLM API error:', llmError)
      
      // Fallback: Generate simple title from first user message
      const fallbackTitle = messages[0].content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>"'&]/g, '') // Remove potentially dangerous characters
        .split(' ')
        .slice(0, 5)
        .join(' ') + '...'
      
      // Try to update with fallback title
      await supabaseAdmin
        .from('chat_sessions')
        .update({ title: fallbackTitle })
        .eq('id', session.id)
        .catch(() => {}) // Ignore errors
      
      return NextResponse.json({ title: fallbackTitle })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }
    
    console.error('Generate title error:', error)
    return NextResponse.json({ error: 'Failed to generate title' }, { status: 500 })
  }
})

export const POST = generateTitleHandler