import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Schema for metadata suggestions
const metadataSuggestionSchema = z.object({
  term_id: z.string(),
  term: z.string(),
  suggestions: z.object({
    category: z.enum(['anatomy', 'conditions', 'procedures', 'materials', 'orthodontics', 'pediatric', 'costs', 'prosthetics', 'specialties']).nullable(),
    difficulty: z.enum(['basic', 'advanced']).nullable(),
    pronunciation: z.string().nullable(),
    also_known_as: z.array(z.string()).nullable(),
    related_terms: z.array(z.string()).nullable(),
    example: z.string().nullable()
  })
})

const requestSchema = z.object({
  term_ids: z.union([
    z.literal('all'),
    z.array(z.string().uuid())
  ]),
  fields: z.array(z.enum(['category', 'difficulty', 'pronunciation', 'also_known_as', 'related_terms', 'example'])).optional()
})

// Response schema for Gemini structured output
const geminiResponseSchema = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          term_id: { type: "string" },
          term: { type: "string" },
          suggestions: {
            type: "object",
            properties: {
              category: { 
                type: "string",
                enum: ["anatomy", "conditions", "procedures", "materials", "orthodontics", "pediatric", "costs", "prosthetics", "specialties"],
                nullable: true
              },
              difficulty: { 
                type: "string",
                enum: ["basic", "advanced"],
                nullable: true
              },
              pronunciation: { type: "string", nullable: true },
              also_known_as: { 
                type: "array",
                items: { type: "string" },
                nullable: true
              },
              related_terms: { 
                type: "array",
                items: { type: "string" },
                nullable: true
              },
              example: { type: "string", nullable: true }
            },
            required: ["category", "difficulty", "pronunciation", "also_known_as", "related_terms", "example"]
          }
        },
        required: ["term_id", "term", "suggestions"]
      }
    }
  },
  required: ["suggestions"]
}

export async function POST(request: NextRequest) {
  // Create a unique ID for this enhancement session
  const sessionId = crypto.randomUUID()
  
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
    const { term_ids, fields } = requestSchema.parse(body)

    // Get terms needing metadata
    let query = supabase
      .from('glossary_terms')
      .select('id, term, definition, category, difficulty, pronunciation, also_known_as, related_terms, example')

    if (term_ids === 'all') {
      // Get all terms with missing metadata
      query = query.or(
        'category.is.null,difficulty.is.null,pronunciation.is.null,also_known_as.is.null,related_terms.is.null,example.is.null'
      )
    } else {
      // Get specific terms
      query = query.in('id', term_ids)
    }

    const { data: terms, error: termsError } = await query

    if (termsError) {
      console.error('Error fetching terms:', termsError)
      return NextResponse.json({ error: 'Failed to fetch terms' }, { status: 500 })
    }

    if (!terms || terms.length === 0) {
      return NextResponse.json({ 
        suggestions: [],
        metadata: { totalTerms: 0 }
      })
    }

    // Get all existing terms for related_terms reference
    const { data: allTerms } = await supabase
      .from('glossary_terms')
      .select('term')
      .order('term')
    
    const existingTerms = allTerms?.map(t => t.term) || []

    // Prepare terms for AI processing
    const termsToProcess = terms.map(term => ({
      term_id: term.id,
      term: term.term,
      definition: term.definition,
      current_metadata: {
        category: term.category,
        difficulty: term.difficulty,
        pronunciation: term.pronunciation,
        also_known_as: term.also_known_as,
        related_terms: term.related_terms,
        example: term.example
      }
    }))

    // Process in batches to avoid timeouts
    const BATCH_SIZE = 10
    const batches = []
    for (let i = 0; i < termsToProcess.length; i += BATCH_SIZE) {
      batches.push(termsToProcess.slice(i, i + BATCH_SIZE))
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: geminiResponseSchema,
        temperature: 0.3
      }
    })

    // Process each batch
    const allSuggestions = []
    const progressData = {
      sessionId,
      totalBatches: batches.length,
      totalTerms: termsToProcess.length,
      processedBatches: 0,
      processedTerms: 0,
      currentBatch: 0
    }
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      progressData.currentBatch = batchIndex + 1
      
      const prompt = `You are a UK dental terminology expert. Analyze these dental glossary terms and suggest missing metadata.

For each term, provide suggestions for any missing fields. Use British English spelling and UK dental terminology.

Terms to analyze:
${JSON.stringify(batch, null, 2)}

Available terms for related_terms (only use exact matches from this list):
${existingTerms.join(', ')}

Guidelines:
1. For category, choose the most appropriate: anatomy, conditions, procedures, materials, orthodontics, pediatric, costs, prosthetics, specialties
2. For difficulty, assess if the term is basic (patient would know) or advanced (professional terminology)
3. For pronunciation, provide phonetic spelling only for complex/unusual terms (e.g., "per-ee-oh-DON-tist" for periodontist)
4. For also_known_as, include common alternatives, abbreviations, or patient-friendly names
5. For related_terms, ONLY use terms that exist in the provided list above
6. For example, provide a simple sentence showing the term in context

Only suggest values for fields that are currently null or empty.`

      try {
        const result = await model.generateContent(prompt)
        const response = JSON.parse(result.response.text())
        
        // Validate each suggestion
        for (const suggestion of response.suggestions) {
          try {
            const validated = metadataSuggestionSchema.parse(suggestion)
            allSuggestions.push(validated)
            progressData.processedTerms++
          } catch (e) {
            console.error('Invalid suggestion format:', e)
          }
        }
        
        progressData.processedBatches++
      } catch (error) {
        console.error(`Error processing batch ${batchIndex + 1}:`, error)
      }
    }

    return NextResponse.json({
      suggestions: allSuggestions,
      metadata: {
        totalTerms: terms.length,
        totalSuggestions: allSuggestions.length,
        batchesProcessed: batches.length,
        progress: progressData
      }
    })

  } catch (error) {
    console.error('Metadata enhancement error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request', 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: 'Failed to enhance metadata',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}