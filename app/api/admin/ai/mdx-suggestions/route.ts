import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ApiErrors } from '@/lib/api-errors'
import { createRouteSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'

const MDXSuggestionsSchema = z.object({
  content: z.string(),
  cursorPosition: z.number().optional(),
  context: z.object({
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    targetAudience: z.enum(['patient', 'professional']).optional(),
  }).optional(),
})

type SuggestionType = 'component' | 'content' | 'correction' | 'enhancement'

interface AISuggestion {
  type: SuggestionType
  title: string
  description: string
  suggestion: string
  confidence: number
  reasoning?: string
  position?: { line: number; column: number }
}

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
    const validatedData = MDXSuggestionsSchema.parse(body)

    const { content, cursorPosition, context } = validatedData

    // Analyze content position if cursor provided
    let currentContext = ''
    if (cursorPosition !== undefined) {
      const lines = content.split('\n')
      const beforeCursor = content.substring(0, cursorPosition)
      const currentLine = beforeCursor.split('\n').length - 1
      currentContext = lines[currentLine] || ''
    }

    // Build context-aware prompt
    const systemPrompt = `You are an expert dental content editor AI assistant. Analyze MDX content for dental articles and provide intelligent suggestions.

Your expertise includes:
- Dental terminology and medical accuracy
- MDX component usage and syntax
- Content structure and readability
- SEO optimization for dental content
- UK spelling and NHS terminology

Available MDX components:
- Alert (types: info, warning, success, error, tip, note, emergency, clinical-note)
- SymptomSeverityScale - Interactive pain rating scale
- TreatmentComparisonTable - Compare multiple treatments
- InteractiveToothChart - Visual dental chart
- MedicationCard - Prescription information
- BeforeAfterGallery - Treatment results
- AppointmentChecklist - Pre/post appointment tasks
- SmartFAQ - Searchable FAQ section
- ClinicalCalculator - Medical calculations
- VideoConsultationCard - Telemedicine info
- InsuranceInfoBox - Coverage details
- EnhancedCostTable - Cost breakdown with calculator
- BranchingTimeline - Treatment journey with decision points

Provide suggestions in these categories:
1. component: Recommend MDX components that would enhance the content
2. content: Suggest additional information or sections
3. correction: Fix grammar, spelling, or medical terminology
4. enhancement: Improve structure, readability, or SEO

${context?.targetAudience ? `Target audience: ${context.targetAudience}` : ''}
${context?.category ? `Article category: ${context.category}` : ''}
${currentContext ? `Current line context: "${currentContext}"` : ''}`

    const userPrompt = `Analyze this dental article content and provide up to 5 high-value suggestions:

${content}

For each suggestion, include:
- type: component/content/correction/enhancement
- title: Brief descriptive title
- description: Why this suggestion is valuable
- suggestion: The actual code or text to add/change
- confidence: 0.0-1.0 score
- reasoning: Brief explanation of your reasoning

Return ONLY a JSON object with a "suggestions" array.`

    // Call LiteLLM proxy with Gemini 2.5 Flash Lite
    const response = await fetch(`${process.env.LITELLM_PROXY_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.LITELLM_MODEL || 'gemini/gemini-2.5-flash-lite-preview-06-17',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('LiteLLM error:', error)
      return ApiErrors.badRequest('Failed to generate suggestions')
    }

    const data = await response.json()
    const aiResponseContent = data.choices[0]?.message?.content

    if (!aiResponseContent) {
      return ApiErrors.badRequest('No response from AI')
    }

    // Parse AI response
    let suggestions: AISuggestion[] = []
    try {
      // Extract JSON from response (sometimes wrapped in markdown)
      const jsonMatch = aiResponseContent.match(/\{[\s\S]*\}/)
      const jsonContent = jsonMatch ? jsonMatch[0] : aiResponseContent
      const parsed = JSON.parse(jsonContent)
      suggestions = parsed.suggestions || []
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Fallback to basic pattern-based suggestions
      suggestions = generateFallbackSuggestions(content, currentContext)
    }

    // Validate and sanitize suggestions
    const validatedSuggestions = suggestions
      .filter(s => s.type && s.title && s.suggestion)
      .slice(0, 5) // Limit to 5 suggestions
      .map(s => ({
        type: s.type as SuggestionType,
        title: s.title.substring(0, 100),
        description: s.description?.substring(0, 200) || '',
        suggestion: s.suggestion.substring(0, 1000),
        confidence: Math.min(1, Math.max(0, s.confidence || 0.5)),
        reasoning: s.reasoning?.substring(0, 200),
        position: s.position,
      }))

    return NextResponse.json({
      success: true,
      suggestions: validatedSuggestions,
      model: 'gemini-2.5-flash-lite',
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validation(error)
    }
    
    console.error('MDX suggestions error:', error)
    return ApiErrors.internal('Failed to generate suggestions')
  }
}

function generateFallbackSuggestions(content: string, currentContext: string): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  const contentLower = content.toLowerCase()

  // Check for missing components
  if (contentLower.includes('treatment') && !contentLower.includes('treatmentcomparisontable')) {
    suggestions.push({
      type: 'component',
      title: 'Add Treatment Comparison Table',
      description: 'Help patients compare treatment options side-by-side',
      suggestion: `<TreatmentComparisonTable 
  treatments={[
    {
      name: "Option 1",
      duration: "1 visit",
      cost: "£100-200",
      successRate: "95%",
      nhsAvailable: true,
      pros: ["Quick", "Affordable"],
      cons: ["May need replacement"],
      painLevel: "low",
      recoveryTime: "1-2 days"
    }
  ]}
/>`,
      confidence: 0.8,
    })
  }

  // Check for missing disclaimers
  if ((contentLower.includes('procedure') || contentLower.includes('treatment')) && 
      !contentLower.includes('consult') && !contentLower.includes('disclaimer')) {
    suggestions.push({
      type: 'enhancement',
      title: 'Add Medical Disclaimer',
      description: 'Important for medical content',
      suggestion: '\n<Alert type="info">\n  Always consult with a qualified dentist for proper diagnosis and treatment.\n</Alert>\n',
      confidence: 0.9,
    })
  }

  // Grammar check
  const commonErrors = [
    { find: /\bteath\b/gi, replace: 'teeth' },
    { find: /\btooth ach\b/gi, replace: 'toothache' },
    { find: /\bgingervitis\b/gi, replace: 'gingivitis' },
  ]

  commonErrors.forEach(({ find, replace }) => {
    if (find.test(content)) {
      suggestions.push({
        type: 'correction',
        title: `Spelling: ${content.match(find)?.[0]} → ${replace}`,
        description: 'Correct dental terminology',
        suggestion: content.replace(find, replace),
        confidence: 0.95,
      })
    }
  })

  return suggestions
}