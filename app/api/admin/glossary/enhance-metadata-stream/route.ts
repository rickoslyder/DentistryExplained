import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'
import { auth } from '@clerk/nextjs/server'
import { liteLLMConfig, isLiteLLMConfigured } from '@/lib/config/litellm'

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

function createSSEMessage(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: NextRequest) {
  const sessionId = crypto.randomUUID()
  
  // Set up SSE response
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection message
        controller.enqueue(encoder.encode(createSSEMessage({ 
          type: 'connected', 
          sessionId,
          message: 'Starting metadata enhancement...'
        })))

        // Check authentication
        const { userId } = await auth()
        if (!userId) {
          controller.enqueue(encoder.encode(createSSEMessage({ 
            type: 'error', 
            message: 'Unauthorized' 
          })))
          controller.close()
          return
        }

        // Validate user is admin
        const supabase = await createServerSupabaseClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('clerk_id', userId)
          .single()

        if (!profile || profile.role !== 'admin') {
          controller.enqueue(encoder.encode(createSSEMessage({ 
            type: 'error', 
            message: 'Admin access required' 
          })))
          controller.close()
          return
        }

        // Check if LiteLLM is configured
        if (!isLiteLLMConfigured()) {
          controller.enqueue(encoder.encode(createSSEMessage({ 
            type: 'error', 
            message: 'AI service not configured' 
          })))
          controller.close()
          return
        }

        // Parse and validate request
        const body = await request.json()
        const { term_ids, fields } = requestSchema.parse(body)

        controller.enqueue(encoder.encode(createSSEMessage({ 
          type: 'progress', 
          message: 'Fetching terms...' 
        })))

        // Get terms needing metadata
        let query = supabase
          .from('glossary_terms')
          .select('id, term, definition, category, difficulty, pronunciation, also_known_as, related_terms, example')

        if (term_ids === 'all') {
          query = query.or(
            'category.is.null,difficulty.is.null,pronunciation.is.null,also_known_as.is.null,related_terms.is.null,example.is.null'
          )
        } else {
          query = query.in('id', term_ids)
        }

        const { data: terms, error: termsError } = await query

        if (termsError) {
          controller.enqueue(encoder.encode(createSSEMessage({ 
            type: 'error', 
            message: 'Failed to fetch terms' 
          })))
          controller.close()
          return
        }

        if (!terms || terms.length === 0) {
          controller.enqueue(encoder.encode(createSSEMessage({ 
            type: 'complete', 
            suggestions: [],
            metadata: { totalTerms: 0 }
          })))
          controller.close()
          return
        }

        controller.enqueue(encoder.encode(createSSEMessage({ 
          type: 'progress', 
          message: `Found ${terms.length} terms to process`,
          totalTerms: terms.length
        })))

        // Get all existing terms for related_terms reference
        const { data: allTerms } = await supabase
          .from('glossary_terms')
          .select('term')
          .order('term')
        
        const existingTerms = allTerms?.map(t => t.term) || []

        // Prepare terms for AI processing
        const termsToProcess = terms.map(term => {
          // Determine which fields need generation based on requested fields
          const fieldsToGenerate: string[] = []
          
          if (fields) {
            // Only check fields that were requested
            if (fields.includes('category') && !term.category) fieldsToGenerate.push('category')
            if (fields.includes('difficulty') && !term.difficulty) fieldsToGenerate.push('difficulty')
            if (fields.includes('pronunciation') && !term.pronunciation) fieldsToGenerate.push('pronunciation')
            if (fields.includes('also_known_as') && (!term.also_known_as || term.also_known_as.length === 0)) fieldsToGenerate.push('also_known_as')
            if (fields.includes('related_terms') && (!term.related_terms || term.related_terms.length === 0)) fieldsToGenerate.push('related_terms')
            if (fields.includes('example') && !term.example) fieldsToGenerate.push('example')
          } else {
            // If no fields specified, check all fields
            if (!term.category) fieldsToGenerate.push('category')
            if (!term.difficulty) fieldsToGenerate.push('difficulty')
            if (!term.pronunciation) fieldsToGenerate.push('pronunciation')
            if (!term.also_known_as || term.also_known_as.length === 0) fieldsToGenerate.push('also_known_as')
            if (!term.related_terms || term.related_terms.length === 0) fieldsToGenerate.push('related_terms')
            if (!term.example) fieldsToGenerate.push('example')
          }
          
          return {
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
            },
            fields_to_generate: fieldsToGenerate
          }
        }).filter(term => term.fields_to_generate.length > 0) // Only process terms that need generation
        
        if (termsToProcess.length === 0) {
          controller.enqueue(encoder.encode(createSSEMessage({ 
            type: 'complete', 
            suggestions: [],
            metadata: { 
              totalTerms: 0,
              message: 'All selected terms already have values for the requested fields.'
            }
          })))
          controller.close()
          return
        }

        // Process in batches
        const BATCH_SIZE = 10
        const batches = []
        for (let i = 0; i < termsToProcess.length; i += BATCH_SIZE) {
          batches.push(termsToProcess.slice(i, i + BATCH_SIZE))
        }

        // Process each batch
        const allSuggestions = []
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex]
          
          controller.enqueue(encoder.encode(createSSEMessage({ 
            type: 'batch-start',
            batchNumber: batchIndex + 1,
            totalBatches: batches.length,
            batchSize: batch.length,
            message: `Processing batch ${batchIndex + 1} of ${batches.length}...`
          })))
          
          const prompt = `You are a UK dental terminology expert. Analyze these dental glossary terms and suggest metadata ONLY for the specified missing fields.

For each term, you will see:
- term_id, term, definition
- current_metadata (existing values - DO NOT regenerate these)
- fields_to_generate (ONLY generate suggestions for these fields)

Terms to analyze:
${JSON.stringify(batch, null, 2)}

Available terms for related_terms (only use exact matches from this list):
${existingTerms.join(', ')}

Guidelines:
1. ONLY generate values for fields listed in "fields_to_generate" for each term
2. For fields NOT in "fields_to_generate", return null
3. For category: choose from anatomy, conditions, procedures, materials, orthodontics, pediatric, costs, prosthetics, specialties
4. For difficulty: assess if basic (patient would know) or advanced (professional terminology)
5. For pronunciation: provide phonetic spelling only for complex/unusual terms
6. For also_known_as: include common alternatives, abbreviations, or patient-friendly names
7. For related_terms: ONLY use terms that exist in the provided list above
8. For example: provide a simple sentence showing the term in context

Respond with a JSON object in this format:
{
  "suggestions": [
    {
      "term_id": "uuid",
      "term": "term name",
      "suggestions": {
        "category": "value or null",
        "difficulty": "value or null",
        "pronunciation": "value or null",
        "also_known_as": ["array"] or null,
        "related_terms": ["array"] or null,
        "example": "value or null"
      }
    }
  ]
}`

          try {
            // Call LiteLLM
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
                    content: 'You are a UK dental terminology expert. Always respond with valid JSON.'
                  },
                  {
                    role: 'user',
                    content: prompt
                  }
                ],
                temperature: 0.3,
                max_tokens: 2000,
                stream: false
              })
            })

            if (!response.ok) {
              throw new Error(`LiteLLM API error: ${await response.text()}`)
            }

            const data = await response.json()
            let content = data.choices[0]?.message?.content || '{}'
            
            // Clean up the response - remove markdown code blocks if present
            content = content.trim()
            if (content.startsWith('```json')) {
              content = content.slice(7) // Remove ```json
            } else if (content.startsWith('```')) {
              content = content.slice(3) // Remove ```
            }
            if (content.endsWith('```')) {
              content = content.slice(0, -3) // Remove trailing ```
            }
            content = content.trim()
            
            // Parse the response
            const parsedResponse = JSON.parse(content)
            
            // Validate each suggestion
            for (const suggestion of parsedResponse.suggestions) {
              try {
                const validated = metadataSuggestionSchema.parse(suggestion)
                allSuggestions.push(validated)
                
                controller.enqueue(encoder.encode(createSSEMessage({ 
                  type: 'term-processed',
                  term: validated.term,
                  termId: validated.term_id
                })))
              } catch (e) {
                console.error('Invalid suggestion format:', e)
              }
            }
            
            controller.enqueue(encoder.encode(createSSEMessage({ 
              type: 'batch-complete',
              batchNumber: batchIndex + 1,
              processedCount: parsedResponse.suggestions.length
            })))
          } catch (error) {
            console.error(`Error processing batch ${batchIndex + 1}:`, error)
            
            controller.enqueue(encoder.encode(createSSEMessage({ 
              type: 'batch-error',
              batchNumber: batchIndex + 1,
              message: `Failed to process batch ${batchIndex + 1}`
            })))
          }
        }

        // Send final results
        controller.enqueue(encoder.encode(createSSEMessage({ 
          type: 'complete',
          suggestions: allSuggestions,
          metadata: {
            totalTerms: terms.length,
            totalSuggestions: allSuggestions.length,
            batchesProcessed: batches.length
          }
        })))

      } catch (error) {
        console.error('Stream error:', error)
        
        controller.enqueue(encoder.encode(createSSEMessage({ 
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        })))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}