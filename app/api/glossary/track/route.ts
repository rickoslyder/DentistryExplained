import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { ApiErrors } from '@/lib/api-errors'

const trackingSchema = z.object({
  term: z.string().min(1),
  interaction_type: z.enum(['view', 'search', 'copy', 'youtube', 'bookmark', 'quiz_attempt']),
  metadata: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = trackingSchema.safeParse(body)
    
    if (!validation.success) {
      return ApiErrors.validationError(validation.error)
    }
    
    const { term, interaction_type, metadata } = validation.data
    const supabase = await createServerSupabaseClient()
    const { userId } = await auth()
    
    // Get session ID from headers or generate one
    const sessionId = request.headers.get('x-session-id') || 
      request.cookies.get('session_id')?.value ||
      crypto.randomUUID()
    
    // First, find the term ID
    const { data: termData, error: termError } = await supabase
      .from('glossary_terms')
      .select('id')
      .eq('term', term)
      .single()
    
    if (termError || !termData) {
      // Log search for non-existent term
      if (interaction_type === 'search') {
        const { error: searchError } = await supabase
          .from('glossary_interactions')
          .insert({
            term_id: null,
            user_id: userId,
            interaction_type: 'search',
            session_id: sessionId,
            metadata: { 
              searched_term: term,
              found: false,
              ...metadata 
            }
          })
        
        if (searchError) {
          console.error('Error logging search:', searchError)
        }
      }
      
      return NextResponse.json({ 
        success: false, 
        message: 'Term not found',
        tracked: interaction_type === 'search' 
      })
    }
    
    // Track the interaction
    const { error: trackError } = await supabase
      .from('glossary_interactions')
      .insert({
        term_id: termData.id,
        user_id: userId,
        interaction_type,
        session_id: sessionId,
        metadata: metadata || {}
      })
    
    if (trackError) {
      console.error('Error tracking interaction:', trackError)
      return ApiErrors.databaseError(trackError)
    }
    
    // Set session cookie if not present
    if (!request.cookies.get('session_id')) {
      const response = NextResponse.json({ success: true })
      response.cookies.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
      return response
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Tracking error:', error)
    return ApiErrors.internalError('glossary-track', error)
  }
}