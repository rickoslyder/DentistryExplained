import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'

const downloadSchema = z.object({
  resourceId: z.string(),
  resourceType: z.enum(['consent-form', 'patient-education']),
  title: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = downloadSchema.parse(body)
    
    const supabase = await createServerSupabaseClient()

    // Verify user is professionally verified
    const { data: verification } = await supabase
      .from('professional_verifications')
      .select('verification_status')
      .eq('user_id', user.id)
      .eq('verification_status', 'verified')
      .single()

    if (!verification) {
      return NextResponse.json({ error: 'Professional verification required' }, { status: 403 })
    }

    // Track the download
    const { data: download, error: trackError } = await supabase
      .from('resource_downloads')
      .insert({
        user_id: user.id,
        resource_id: validatedData.resourceId,
        resource_type: validatedData.resourceType,
        resource_title: validatedData.title,
        downloaded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (trackError) {
      console.error('Download tracking error:', trackError)
      // Don't fail the request if tracking fails
    }

    // Update download count (non-blocking)
    if (validatedData.resourceType === 'consent-form') {
      supabase.rpc('increment_consent_form_downloads', { 
        form_id: validatedData.resourceId 
      }).catch(err => console.error('Failed to increment download count:', err))
    } else if (validatedData.resourceType === 'patient-education') {
      supabase.rpc('increment_education_material_downloads', { 
        material_id: validatedData.resourceId 
      }).catch(err => console.error('Failed to increment download count:', err))
    }

    return NextResponse.json({ 
      success: true,
      downloadId: download?.id
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Download tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}