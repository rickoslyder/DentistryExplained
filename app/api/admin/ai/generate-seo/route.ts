import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ApiErrors } from '@/lib/api-errors'
import { createRouteSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'

const GenerateSEOSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  currentMetaTitle: z.string().optional(),
  currentMetaDescription: z.string().optional(),
  currentMetaKeywords: z.array(z.string()).optional().default([]),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return ApiErrors.unauthorized()
    }

    const supabase = await createRouteSupabaseClient()
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', userId)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required')
    }

    const body = await request.json()
    const validatedData = GenerateSEOSchema.parse(body)

    // Build context from available metadata
    const contextParts = []
    if (validatedData.title) contextParts.push(`Title: ${validatedData.title}`)
    if (validatedData.excerpt) contextParts.push(`Excerpt: ${validatedData.excerpt}`)
    if (validatedData.category) contextParts.push(`Category: ${validatedData.category}`)
    if (validatedData.tags.length > 0) contextParts.push(`Tags: ${validatedData.tags.join(', ')}`)
    if (validatedData.content) {
      // Take first 1000 characters of content for context
      const contentPreview = validatedData.content.slice(0, 1000)
      contextParts.push(`Content preview: ${contentPreview}...`)
    }

    if (contextParts.length === 0) {
      return ApiErrors.badRequest('Please provide at least one field to generate SEO metadata')
    }

    const context = contextParts.join('\n\n')

    const systemPrompt = `You are an SEO specialist for a dental health website. Generate optimized SEO metadata following these guidelines:

1. Meta Title (50-60 characters):
   - Include primary keyword naturally
   - Make it compelling and click-worthy
   - Include site name suffix if space allows: " | Dentistry Explained"

2. Meta Description (150-160 characters):
   - Summarize the article's value proposition
   - Include a call-to-action
   - Use active voice
   - Include relevant keywords naturally

3. Meta Keywords (5-10 keywords):
   - Include primary and secondary keywords
   - Mix of broad and specific terms
   - Relevant to dental health
   - Consider search intent

Focus on UK dental terminology and British English spelling.`

    const userPrompt = `Based on the following article information, generate SEO metadata:

${context}

Return a JSON object with these exact fields:
{
  "metaTitle": "string (50-60 chars)",
  "metaDescription": "string (150-160 chars)",
  "metaKeywords": ["array", "of", "keywords"]
}`

    // Call LiteLLM proxy
    const response = await fetch(`${process.env.LITELLM_PROXY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' }
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('LiteLLM error:', error)
      throw new Error('Failed to generate SEO metadata')
    }

    const result = await response.json()
    const aiResponse = result.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    // Parse the response
    let seoData: any = {}
    try {
      seoData = JSON.parse(aiResponse)
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse)
      throw new Error('Failed to parse SEO suggestions')
    }

    // Validate and clean the response
    const metaTitle = seoData.metaTitle?.slice(0, 60) || ''
    const metaDescription = seoData.metaDescription?.slice(0, 160) || ''
    const metaKeywords = Array.isArray(seoData.metaKeywords) 
      ? seoData.metaKeywords
          .filter((k: any) => typeof k === 'string' && k.length > 0)
          .map((k: string) => k.toLowerCase().trim())
          .slice(0, 10)
      : []

    // Check character counts
    const suggestions = {
      metaTitle: {
        value: metaTitle,
        length: metaTitle.length,
        optimal: metaTitle.length >= 50 && metaTitle.length <= 60
      },
      metaDescription: {
        value: metaDescription,
        length: metaDescription.length,
        optimal: metaDescription.length >= 150 && metaDescription.length <= 160
      },
      metaKeywords: {
        value: metaKeywords,
        count: metaKeywords.length,
        optimal: metaKeywords.length >= 5 && metaKeywords.length <= 10
      }
    }

    return NextResponse.json({
      success: true,
      suggestions
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validation(error)
    }
    
    return ApiErrors.internal(error, 'seo-generation')
  }
}