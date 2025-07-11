import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { liteLLMConfig, isLiteLLMConfigured } from '@/lib/config/litellm'

const requestSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
  difficulty: z.enum(['basic', 'advanced']).nullable().optional(),
  previousExample: z.string().optional(),
  feedback: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate user is admin
    const supabase = await createServerSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', userId)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse and validate request
    const body = await request.json()
    const { term, definition, difficulty, previousExample, feedback } = requestSchema.parse(body)

    // Check if LiteLLM is configured
    if (!isLiteLLMConfigured()) {
      return NextResponse.json({ 
        error: 'AI service not configured' 
      }, { status: 503 })
    }

    // Create prompt based on difficulty level
    const difficultyContext = difficulty === 'basic' 
      ? 'Write for a general patient audience using simple, everyday language.'
      : difficulty === 'advanced'
      ? 'Write for dental professionals or well-informed patients using appropriate clinical terminology.'
      : 'Write for a general audience with clear, accessible language.'

    let prompt = `You are a UK dental education expert. Generate a single example sentence that demonstrates the use of the dental term "${term}" in context.

Term: ${term}
Definition: ${definition}

Requirements:
- ${difficultyContext}
- Use British English spelling and terminology
- Make it relevant to a UK dental context (mention NHS if appropriate)
- Keep it concise (one sentence, maximum 30 words)
- Make it practical and relatable
- Show the term being used naturally in conversation or explanation`

    // If regenerating with feedback, include the previous example and feedback
    if (previousExample && feedback) {
      prompt += `\n\nPrevious example: "${previousExample}"
User feedback: ${feedback}

Please generate a new example that addresses the feedback while maintaining all the requirements above.`
    }

    prompt += '\n\nExample sentence:'

    try {
      // Call LiteLLM proxy
      const response = await fetch(`${liteLLMConfig.proxyUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${liteLLMConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: liteLLMConfig.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are a UK dental education expert. Generate concise, accurate example sentences for dental terms.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
          stream: false
        })
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`LiteLLM API error: ${error}`)
      }

      const data = await response.json()
      const example = data.choices[0]?.message?.content?.trim() || ''
      
      // Clean up the response (remove quotes if present)
      const cleanExample = example.replace(/^["']|["']$/g, '').trim()
      
      return NextResponse.json({ 
        example: cleanExample,
        term,
      })
      
    } catch (error) {
      console.error('AI generation error:', error)
      return NextResponse.json({ 
        error: 'Failed to generate example',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Example generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to generate example',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}