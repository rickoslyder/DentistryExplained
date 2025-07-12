import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ApiErrors } from '@/lib/api-errors'
import { ResearchRequestSchema } from '@/lib/research'
import { createRouteSupabaseClient } from '@/lib/supabase-auth'
import { v4 as uuidv4 } from 'uuid'

const RESEARCH_SERVICE_URL = process.env.RESEARCH_SERVICE_URL || 'http://localhost:8000'
const RESEARCH_SERVICE_AUTH_TOKEN = process.env.RESEARCH_SERVICE_AUTH_TOKEN || 'development-token-change-in-production'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return ApiErrors.unauthorized()
    }

    const supabase = await createRouteSupabaseClient()
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('clerk_id', userId)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required')
    }

    const userDbId = profile.id

    const body = await request.json()
    const validatedData = ResearchRequestSchema.parse(body)

    // Create a new TransformStream for SSE
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Function to send SSE message
    const sendMessage = (data: any) => {
      const message = `data: ${JSON.stringify(data)}\n\n`
      writer.write(encoder.encode(message))
    }

    // Start the research in the background
    (async () => {
      let researchOutputId: string | null = null
      let draftId: string | null = null
      
      try {
        // Initial stages
        const stages = [
          { id: 'init', name: 'Initializing research', status: 'completed' },
          { id: 'search', name: 'Searching for sources', status: 'active' },
          { id: 'analyze', name: 'Analyzing content', status: 'pending' },
          { id: 'synthesize', name: 'Synthesizing information', status: 'pending' },
          { id: 'generate', name: 'Generating report', status: 'pending' },
          { id: 'finalize', name: 'Finalizing document', status: 'pending' }
        ]

        sendMessage({ type: 'stages', stages })

        // Create research output record
        const { data: researchOutput, error: researchError } = await supabase
          .from('research_outputs')
          .insert({
            id: uuidv4(),
            user_id: userDbId,
            topic: validatedData.topic,
            report_type: validatedData.reportType,
            audience: validatedData.audience,
            status: 'in_progress',
            metadata: {
              sources_count: validatedData.sourcesCount,
              focus_medical: validatedData.focusMedical,
              include_citations: validatedData.includeCitations,
              reading_level: validatedData.readingLevel,
            }
          })
          .select()
          .single()

        if (researchError) {
          console.error('Failed to create research output:', researchError)
        } else {
          researchOutputId = researchOutput.id
          sendMessage({ type: 'research_id', id: researchOutputId })
        }

        // Update search stage
        await new Promise(resolve => setTimeout(resolve, 1000))
        sendMessage({ 
          type: 'stage_update', 
          stageId: 'search', 
          update: { status: 'active', message: 'Searching trusted dental sources...' }
        })

        // Simulate search completion
        await new Promise(resolve => setTimeout(resolve, 3000))
        sendMessage({ 
          type: 'stage_update', 
          stageId: 'search', 
          update: { status: 'completed', message: `Found ${validatedData.sourcesCount} relevant sources` }
        })

        // Analyze stage
        sendMessage({ 
          type: 'stage_update', 
          stageId: 'analyze', 
          update: { status: 'active', message: 'Reading and analyzing content...' }
        })

        await new Promise(resolve => setTimeout(resolve, 4000))
        sendMessage({ 
          type: 'stage_update', 
          stageId: 'analyze', 
          update: { status: 'completed' }
        })

        // Synthesize stage
        sendMessage({ 
          type: 'stage_update', 
          stageId: 'synthesize', 
          update: { status: 'active', message: 'Organizing information...' }
        })

        await new Promise(resolve => setTimeout(resolve, 2000))
        sendMessage({ 
          type: 'stage_update', 
          stageId: 'synthesize', 
          update: { status: 'completed' }
        })

        // Generate stage
        sendMessage({ 
          type: 'stage_update', 
          stageId: 'generate', 
          update: { status: 'active', message: `Writing ${validatedData.audience} level content...` }
        })

        // Call the actual research service
        const response = await fetch(`${RESEARCH_SERVICE_URL}/research`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEARCH_SERVICE_AUTH_TOKEN}`,
          },
          body: JSON.stringify({
            topic: validatedData.topic,
            report_type: validatedData.reportType,
            sources_count: validatedData.sourcesCount,
            focus_medical: validatedData.focusMedical,
            include_citations: validatedData.includeCitations,
            audience: validatedData.audience,
            reading_level: validatedData.readingLevel,
          }),
        })

        if (!response.ok) {
          throw new Error(`Research service error: ${response.status}`)
        }

        const result = await response.json()
        
        sendMessage({ 
          type: 'stage_update', 
          stageId: 'generate', 
          update: { status: 'completed' }
        })

        // Finalize stage
        sendMessage({ 
          type: 'stage_update', 
          stageId: 'finalize', 
          update: { status: 'active', message: 'Adding citations and formatting...' }
        })

        await new Promise(resolve => setTimeout(resolve, 1000))

        // Format the content
        const ResearchResponseSchema = (await import('@/lib/research')).ResearchResponseSchema
        const formatResearchAsMarkdown = (await import('@/lib/research')).formatResearchAsMarkdown
        
        const validatedResponse = ResearchResponseSchema.parse(result)
        const formattedContent = formatResearchAsMarkdown(validatedResponse)

        // Update research output with results
        if (researchOutputId) {
          await supabase
            .from('research_outputs')
            .update({
              status: 'completed',
              content: formattedContent,
              raw_response: result,
              sources: validatedResponse.sources,
            })
            .eq('id', researchOutputId)
        }

        // Create article draft from research
        const { data: draft, error: draftError } = await supabase
          .from('article_drafts')
          .insert({
            user_id: userDbId,
            title: `Research: ${validatedData.topic}`,
            content: formattedContent,
            draft_version: 1,
            is_auto_save: true,
            metadata: {
              research_output_id: researchOutputId,
              created_from: 'research',
              research_params: validatedData,
            }
          })
          .select()
          .single()

        if (!draftError && draft) {
          draftId = draft.id
          sendMessage({ 
            type: 'draft_created', 
            draftId,
            message: 'Draft article created from research'
          })
        }

        sendMessage({ 
          type: 'stage_update', 
          stageId: 'finalize', 
          update: { status: 'completed' }
        })

        sendMessage({ type: 'content', content: formattedContent })
        sendMessage({ type: 'complete', draftId })
      } catch (error) {
        // Update research output status to failed if it exists
        if (researchOutputId) {
          await supabase
            .from('research_outputs')
            .update({
              status: 'failed',
              metadata: {
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                failed_at: new Date().toISOString(),
              }
            })
            .eq('id', researchOutputId)
        }
        
        sendMessage({ 
          type: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error occurred' 
        })
      } finally {
        writer.close()
      }
    })()

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    return ApiErrors.internal(error, 'research-stream')
  }
}