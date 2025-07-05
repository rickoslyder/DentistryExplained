import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'

// Schema for generated terms
const generatedTermSchema = z.object({
  term: z.string().min(1).max(100),
  definition: z.string().min(10).max(500),
  pronunciation: z.string().nullable(),
  also_known_as: z.array(z.string()).nullable(),
  related_terms: z.array(z.string()).nullable(),
  category: z.enum(['anatomy', 'conditions', 'procedures', 'materials', 'orthodontics', 'pediatric', 'costs', 'prosthetics', 'specialties']),
  difficulty: z.enum(['basic', 'advanced']),
  example: z.string().nullable()
})

const requestSchema = z.object({
  count: z.number().min(1).max(10).default(5),
  category: z.enum(['anatomy', 'conditions', 'procedures', 'materials', 'orthodontics', 'pediatric', 'costs', 'prosthetics', 'specialties', 'any']).optional(),
  difficulty: z.enum(['basic', 'advanced', 'mixed']).optional()
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
      .eq('user_id', userId)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse and validate request
    const body = await request.json()
    const { count, category, difficulty } = requestSchema.parse(body)

    // Get existing terms to avoid duplicates
    const { data: existingTerms } = await supabase
      .from('glossary_terms')
      .select('term, category')
    
    const existingTermNames = new Set(existingTerms?.map(t => t.term.toLowerCase()) || [])

    // Build prompt based on parameters
    const categoryFilter = category && category !== 'any' ? `in the "${category}" category` : ''
    const difficultyFilter = difficulty && difficulty !== 'mixed' ? `at the "${difficulty}" level` : ''
    
    const systemPrompt = `You are a UK dental terminology expert with deep knowledge of NHS dentistry and British dental practices. 
Your task is to generate unique, high-quality dental glossary terms that don't exist in the provided list.

Think carefully about:
1. Terms commonly used in UK dental practices but often misunderstood by patients
2. NHS-specific terminology and band classifications
3. British English spelling and terminology (e.g., "anaesthetic" not "anesthetic")
4. Terms that bridge the gap between professional jargon and patient understanding
5. Contemporary dental technologies and treatments available in the UK

Each term should be practical, educational, and help patients better understand their dental care.`

    const userPrompt = `Generate ${count} unique dental glossary terms ${categoryFilter} ${difficultyFilter}.
      
Existing terms to avoid (case-insensitive): ${Array.from(existingTermNames).join(', ')}

Return a JSON array with exactly ${count} objects matching this schema:
{
  "term": "string (the dental term)",
  "definition": "string (clear, concise definition for UK patients)",
  "pronunciation": "string or null (phonetic pronunciation if complex)",
  "also_known_as": ["array of alternative names"] or null,
  "related_terms": ["array of related term names"] or null,
  "category": "anatomy|conditions|procedures|materials|orthodontics|pediatric|costs|prosthetics|specialties",
  "difficulty": "basic|advanced",
  "example": "string (example sentence using the term) or null"
}

Important:
- Ensure terms are relevant to UK dentistry
- Include NHS band information for cost-related terms
- Use British English spelling
- Make definitions patient-friendly
- Only include pronunciation for complex terms
- Related terms should reference other glossary terms when possible`

    // Call OpenAI API with o4-mini reasoning model
    const openAIResponse = await fetch('https://openai-proxy-0l7e.onrender.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.LITELLM_REASONING_MODEL || 'o4-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        reasoning_effort: 'medium', // Reasoning models support this parameter
        max_completion_tokens: 4000, // Higher limit for reasoning tokens
        response_format: { type: 'json_object' }
      })
    })

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', await openAIResponse.text())
      return NextResponse.json({ error: 'Failed to generate terms' }, { status: 500 })
    }

    const aiData = await openAIResponse.json()
    const generatedContent = JSON.parse(aiData.choices[0].message.content)

    // Extract array from response (handle different response formats)
    let terms = Array.isArray(generatedContent) ? generatedContent : 
                generatedContent.terms || generatedContent.glossary_terms || []

    // Validate and filter generated terms
    const validTerms = []
    for (const term of terms) {
      try {
        const validated = generatedTermSchema.parse(term)
        // Double-check it's not a duplicate
        if (!existingTermNames.has(validated.term.toLowerCase())) {
          validTerms.push(validated)
        }
      } catch (error) {
        console.error('Invalid generated term:', term, error)
      }
    }

    // Get category distribution for existing terms
    const categoryStats = existingTerms?.reduce((acc, term) => {
      if (term.category) {
        acc[term.category] = (acc[term.category] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>) || {}

    return NextResponse.json({
      terms: validTerms,
      metadata: {
        requested: count,
        generated: validTerms.length,
        existingTermsCount: existingTermNames.size,
        categoryDistribution: categoryStats
      }
    })

  } catch (error) {
    console.error('Term generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to generate terms',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}