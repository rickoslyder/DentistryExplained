import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ApiErrors } from '@/lib/api-errors'
import { ResearchService, ResearchRequestSchema } from '@/lib/research'
import { createClientWithClerkAuth } from '@/lib/supabase-auth'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return ApiErrors.unauthorized()
    }

    const supabase = await createClientWithClerkAuth()
    
    // Check if user is a verified professional
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError || profile?.role !== 'professional') {
      // Check if admin
      if (profile?.role !== 'admin') {
        return ApiErrors.forbidden('Professional or admin access required')
      }
    }

    // Check professional verification status
    if (profile?.role === 'professional') {
      const { data: verification } = await supabase
        .from('professional_verifications')
        .select('status')
        .eq('user_id', userId)
        .single()

      if (!verification || verification.status !== 'approved') {
        return ApiErrors.forbidden('Professional verification required')
      }
    }

    const body = await request.json()
    const validatedData = ResearchRequestSchema.parse(body)

    const researchService = new ResearchService()
    
    const serviceHealthy = await researchService.checkHealth()
    if (!serviceHealthy) {
      return ApiErrors.serviceUnavailable('Research service is currently unavailable')
    }

    // Use professional research endpoint for enhanced medical focus
    const researchResult = await researchService.professionalResearch(validatedData)

    // Track professional research usage
    await supabase
      .from('professional_research_logs')
      .insert({
        user_id: userId,
        topic: validatedData.topic,
        report_type: validatedData.reportType,
        sources_count: researchResult.sources.length,
        word_count: researchResult.metadata.word_count
      })

    return NextResponse.json({
      success: true,
      data: {
        report: researchResult.report,
        sources: researchResult.sources,
        metadata: researchResult.metadata,
        generatedAt: researchResult.generated_at
      }
    })

  } catch (error) {
    if (error instanceof Error && error.message.includes('Research service error')) {
      return ApiErrors.externalService(error.message, 'research-service')
    }
    
    return ApiErrors.internal(error, 'professional-research')
  }
}