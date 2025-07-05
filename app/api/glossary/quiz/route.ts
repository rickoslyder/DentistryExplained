import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { ApiErrors } from '@/lib/api-errors'

const quizResultSchema = z.object({
  term_id: z.string().uuid(),
  correct: z.boolean(),
  response_time_ms: z.number().min(0),
  difficulty: z.enum(['basic', 'advanced']).optional()
})

// POST - Save quiz result
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = quizResultSchema.safeParse(body)
    
    if (!validation.success) {
      return ApiErrors.validationError(validation.error)
    }
    
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Generate session ID for this quiz session
    const sessionId = crypto.randomUUID()
    
    const { error } = await supabase
      .from('glossary_quiz_results')
      .insert({
        user_id: userId,
        term_id: validation.data.term_id,
        correct: validation.data.correct,
        response_time_ms: validation.data.response_time_ms,
        difficulty: validation.data.difficulty,
        session_id: sessionId
      })
    
    if (error) {
      console.error('Error saving quiz result:', error)
      return ApiErrors.databaseError(error)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Quiz error:', error)
    return ApiErrors.internalError('glossary-quiz', error)
  }
}

// GET - Get user's quiz stats
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Get user's quiz statistics
    const { data: stats, error: statsError } = await supabase
      .from('user_quiz_stats')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (statsError && statsError.code !== 'PGRST116') { // Not found is ok
      return ApiErrors.databaseError(statsError)
    }
    
    // Get recent quiz results
    const { data: recentResults, error: resultsError } = await supabase
      .from('glossary_quiz_results')
      .select(`
        id,
        correct,
        response_time_ms,
        created_at,
        glossary_terms (
          term,
          category,
          difficulty
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (resultsError) {
      return ApiErrors.databaseError(resultsError)
    }
    
    // Calculate streak
    const today = new Date().toDateString()
    const hasQuizToday = recentResults?.some(
      r => new Date(r.created_at).toDateString() === today
    )
    
    return NextResponse.json({
      stats: stats || {
        total_attempts: 0,
        correct_answers: 0,
        accuracy_percentage: 0,
        avg_response_time: 0,
        days_practiced: 0
      },
      recentResults: recentResults || [],
      hasQuizToday
    })
    
  } catch (error) {
    console.error('Quiz stats error:', error)
    return ApiErrors.internalError('glossary-quiz-stats', error)
  }
}