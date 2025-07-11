import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ApiErrors } from '@/lib/api-errors'
import { createRouteSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'

const GenerateTagsSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  category: z.string().optional(),
  existingTags: z.array(z.string()).optional().default([]),
  tagCount: z.number().min(1).max(10).optional().default(5),
  mode: z.enum(['replace', 'append']).optional().default('replace'),
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
    const validatedData = GenerateTagsSchema.parse(body)

    // Build context from available metadata
    const contextParts = []
    if (validatedData.title) contextParts.push(`Title: ${validatedData.title}`)
    if (validatedData.excerpt) contextParts.push(`Excerpt: ${validatedData.excerpt}`)
    if (validatedData.category) contextParts.push(`Category: ${validatedData.category}`)
    if (validatedData.content) {
      // Take first 500 characters of content for context
      const contentPreview = validatedData.content.slice(0, 500)
      contextParts.push(`Content preview: ${contentPreview}...`)
    }

    if (contextParts.length === 0) {
      return ApiErrors.badRequest('Please provide at least one field (title, content, excerpt, or category) to generate tags')
    }

    const context = contextParts.join('\n\n')

    // Build prompt based on mode
    let systemPrompt = `You are a dental content tagging assistant. Generate relevant tags for dental articles.
Tags should be:
- Specific to dentistry and dental health
- SEO-friendly (lowercase, hyphenated)
- Relevant to the content
- Mix of broad and specific terms
- Include condition names, treatment types, and relevant dental terms`

    let userPrompt = ''
    
    if (validatedData.mode === 'append' && validatedData.existingTags.length > 0) {
      userPrompt = `Based on the following article information, suggest ${validatedData.tagCount} NEW tags that complement the existing tags.

Existing tags: ${validatedData.existingTags.join(', ')}

${context}

Generate ${validatedData.tagCount} additional tags that:
1. Don't duplicate existing tags
2. Add new dimensions to the article's discoverability
3. Cover aspects not already tagged

Return ONLY the tags as a JSON array of strings, no explanation.`
    } else {
      userPrompt = `Based on the following article information, generate ${validatedData.tagCount} relevant tags:

${context}

Return ONLY the tags as a JSON array of strings, no explanation.`
    }

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
        max_tokens: 200,
        response_format: { type: 'json_object' }
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('LiteLLM error:', error)
      throw new Error('Failed to generate tags')
    }

    const result = await response.json()
    const aiResponse = result.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    // Parse the response
    let tags: string[] = []
    try {
      const parsed = JSON.parse(aiResponse)
      if (Array.isArray(parsed)) {
        tags = parsed
      } else if (parsed.tags && Array.isArray(parsed.tags)) {
        tags = parsed.tags
      } else {
        throw new Error('Invalid response format')
      }
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse)
      throw new Error('Failed to parse tag suggestions')
    }

    // Clean and validate tags
    tags = tags
      .filter(tag => typeof tag === 'string' && tag.length > 0)
      .map(tag => tag.toLowerCase().trim().replace(/\s+/g, '-'))
      .filter(tag => tag.length >= 2 && tag.length <= 30)
      .slice(0, validatedData.tagCount)

    // Remove duplicates
    tags = [...new Set(tags)]

    // If appending, make sure we don't duplicate existing tags
    if (validatedData.mode === 'append' && validatedData.existingTags.length > 0) {
      const existingTagsLower = validatedData.existingTags.map(t => t.toLowerCase())
      tags = tags.filter(tag => !existingTagsLower.includes(tag))
    }

    return NextResponse.json({
      success: true,
      tags,
      mode: validatedData.mode,
      count: tags.length
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validation(error)
    }
    
    return ApiErrors.internal(error, 'tag-generation')
  }
}