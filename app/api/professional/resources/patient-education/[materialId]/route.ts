import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { generateEducationMaterialPDF } from '@/lib/pdf/education-materials'

export async function GET(
  req: NextRequest,
  { params }: { params: { materialId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()
    
    // First get the user's profile with the Supabase ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('clerk_id', userId)
      .single()

    if (profileError || !profile) {
      console.error('[Patient Education] Profile fetch error:', profileError)
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (profile.user_type !== 'professional') {
      return NextResponse.json(
        { error: 'Professional account required' },
        { status: 403 }
      )
    }
    
    // Check if this is a preview request
    const { searchParams } = new URL(req.url)
    const isPreview = searchParams.get('preview') === 'true'

    // For downloads, verify user is professionally verified
    let practiceDetails = {
      practiceName: 'Preview Only',
      practiceAddress: 'Professional verification required for customization',
      practicePhone: '',
      practiceWebsite: '',
    }

    if (!isPreview) {
      const { data: verification } = await supabase
        .from('professional_verifications')
        .select('*')
        .eq('user_id', profile.id) // Use the Supabase profile ID, not Clerk ID
        .eq('verification_status', 'verified')
        .single()

      if (!verification) {
        return NextResponse.json({ error: 'Professional verification required' }, { status: 403 })
      }

      practiceDetails = {
        practiceName: verification.practice_name || 'Your Practice Name',
        practiceAddress: verification.practice_address || 'Your Practice Address',
        practicePhone: verification.practice_phone || '',
        practiceWebsite: verification.practice_website || '',
      }
    }

    // Generate PDF based on material ID
    const pdfBuffer = await generateEducationMaterialPDF(params.materialId, practiceDetails)

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isPreview 
          ? `inline; filename="${params.materialId}-preview.pdf"`
          : `attachment; filename="${params.materialId}-patient-education.pdf"`,
      },
    })
  } catch (error) {
    console.error('Education material generation error:', error)
    return NextResponse.json({ error: 'Failed to generate education material' }, { status: 500 })
  }
}