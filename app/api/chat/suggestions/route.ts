import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, withRateLimit, compose } from '@/lib/api-middleware'
import { ApiErrors, getRequestId } from '@/lib/api-errors'
import { generateAIResponse } from '@/lib/litellm'
import { currentUser } from '@clerk/nextjs/server'

// Schema for suggestions request
const suggestionsSchema = z.object({
  query: z.string().min(1).max(500),
  context: z.object({
    title: z.string().optional(),
    category: z.string().optional()
  }).optional()
})

const suggestionsHandler = compose(
  withRateLimit(60000, 100), // Higher limit for concurrent requests
  withAuth
)(async (request: NextRequest, context) => {
  const requestId = getRequestId(request)
  
  try {
    const body = await request.json()
    const params = suggestionsSchema.parse(body)
    const { query, context: pageContext } = params
    const { userProfile } = context

    // Get user preferences
    const clerkUser = await currentUser()
    const userPreferences = clerkUser?.unsafeMetadata?.settings?.aiAssistant

    // Build user context for AI
    const userContext = {
      user_type: userProfile.user_type,
      preferences: userPreferences ? {
        responseStyle: userPreferences.responseStyle || 'concise',
        complexityLevel: userPreferences.complexityLevel || 'basic',
        includeCosts: userPreferences.includeCosts || false,
        autoSuggestFollowUp: userPreferences.autoSuggestFollowUp !== false
      } : undefined
    }

    // Create a specialized prompt for generating follow-up questions
    const prompt = `Based on this dental health query: "${query}"
    
Generate exactly 3 relevant follow-up questions that a ${userProfile.user_type === 'professional' ? 'dental professional' : 'patient'} might ask next.

Requirements:
- Questions should be natural and conversational
- Match the ${userContext.preferences?.complexityLevel || 'basic'} complexity level
- Be specific to the topic discussed
- Each question should explore a different aspect
${pageContext?.category ? `- Consider the context: ${pageContext.category}` : ''}

Return ONLY the 3 questions as a JSON array, nothing else.
Example format: ["Question 1?", "Question 2?", "Question 3?"]`

    try {
      const response = await generateAIResponse(
        prompt,
        [],
        pageContext,
        false,
        userContext
      )

      // Parse the AI response to extract questions
      let questions: string[] = []
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(response as string)
        if (Array.isArray(parsed)) {
          questions = parsed.filter(q => typeof q === 'string').slice(0, 3)
        }
      } catch {
        // Fallback: extract questions from text
        const lines = (response as string).split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0 && line.endsWith('?'))
          .slice(0, 3)
        
        questions = lines.length > 0 ? lines : [
          "Can you tell me more about this?",
          "What should I do next?",
          "When should I see a dentist about this?"
        ]
      }

      // Cache the response for 5 minutes
      const headers = {
        'Cache-Control': 'private, max-age=300',
        'X-Request-Id': requestId
      }

      return NextResponse.json({ 
        questions,
        generated: true 
      }, { headers })

    } catch (error: any) {
      // Return fallback questions on AI error
      console.error(`[Suggestions ${requestId}] AI generation failed:`, error)
      
      return NextResponse.json({ 
        questions: [
          "Can you explain this in more detail?",
          "What are my options?",
          "Is this something I should be concerned about?"
        ],
        generated: false 
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.fromValidationError(error, requestId)
    }
    return ApiErrors.internal(error, 'suggestions', requestId)
  }
})

export const POST = suggestionsHandler