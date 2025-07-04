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

    // Track the download (you would create a downloads table for this)
    // For now, we'll just log it and return success
    console.log('Download tracked:', {
      userId: user.id,
      ...validatedData,
      downloadedAt: new Date().toISOString()
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Download tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}