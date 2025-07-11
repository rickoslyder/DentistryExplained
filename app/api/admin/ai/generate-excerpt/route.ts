import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'

// Schema for excerpt generation request
const excerptRequestSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    // Check if user is admin
    const supabase = await createServerSupabaseClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    // Parse and validate request
    const body = await request.json()
    const { title, content, category, tags } = excerptRequestSchema.parse(body)
    
    // Build context for AI
    const contextParts = []
    if (category && category !== 'uncategorized') {
      contextParts.push(`Category: ${category}`)
    }
    if (tags && tags.length > 0) {
      contextParts.push(`Tags: ${tags.join(', ')}`)
    }
    
    const context = contextParts.length > 0 ? `\n\nContext:\n${contextParts.join('\n')}` : ''
    
    // Create system prompt for excerpt generation
    const systemPrompt = `You are an expert medical content writer specializing in dental health education for UK patients. Your task is to generate compelling, SEO-friendly article excerpts that:

1. Summarize the key value proposition of the article
2. Use patient-friendly language while maintaining medical accuracy
3. Include relevant keywords naturally
4. Create curiosity to encourage clicks
5. Stay within 150-200 characters for optimal display
6. Reflect UK dental terminology and NHS context where relevant

Important guidelines:
- Write in British English
- Avoid medical jargon unless necessary
- Make it informative yet engaging
- Focus on benefits to the reader
- Include a subtle call-to-action feel`

    const userPrompt = `Generate a compelling excerpt for this dental article:

Title: ${title}${context}${content ? `\n\nArticle Preview:\n${content.substring(0, 500)}...` : ''}

Return only the excerpt text, no additional formatting or explanation.`

    // Call Gemini 2.5 Flash for fast generation
    const response = await fetch(`${process.env.LITELLM_PROXY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
        stream: false,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('LiteLLM excerpt generation error:', errorText)
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to generate excerpt',
          details: errorText,
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const data = await response.json()
    const excerpt = data.choices[0].message.content.trim()
    
    return NextResponse.json({
      success: true,
      excerpt,
      usage: data.usage,
      model: data.model,
    })
  } catch (error) {
    console.error('Error generating excerpt:', error)
    
    if (error instanceof z.ZodError) {
      return new NextResponse(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request data',
          details: error.errors,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to generate excerpt',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Clerk-Backend-API-URL, Clerk-Frontend-API-URL',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}