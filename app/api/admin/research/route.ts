import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ApiErrors } from '@/lib/api-errors'
import { ResearchService, ResearchRequestSchema, formatResearchAsMarkdown } from '@/lib/research'
import { createClientWithClerkAuth } from '@/lib/supabase-auth'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return ApiErrors.unauthorized()
    }

    const supabase = await createClientWithClerkAuth()
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return ApiErrors.forbidden('Admin access required')
    }

    const body = await request.json()
    const validatedData = ResearchRequestSchema.parse(body)

    const researchService = new ResearchService()
    
    const serviceHealthy = await researchService.checkHealth()
    if (!serviceHealthy) {
      return ApiErrors.serviceUnavailable('Research service is currently unavailable')
    }

    const researchResult = await researchService.conductResearch(validatedData)

    const formattedContent = formatResearchAsMarkdown(researchResult)

    return NextResponse.json({
      success: true,
      data: {
        content: formattedContent,
        metadata: researchResult.metadata,
        sources: researchResult.sources,
      }
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('Research service error')) {
      return ApiErrors.externalService(error.message, 'research-service')
    }
    
    return ApiErrors.internal(error, 'research')
  }
}