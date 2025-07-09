import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { generateConsentFormPDF } from '@/lib/pdf/consent-forms'
import { getCurrentUserProfile } from '@/lib/supabase-auth'

// Map of form IDs used in the UI to the template IDs in the PDF generator
const formIdMapping: Record<string, string> = {
  '1': 'root-canal',
  '2': 'dental-implants',
  '3': 'teeth-whitening',
  '4': 'extraction-simple',
  '5': 'orthodontics',
  '6': 'crown-bridge',
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user is a professional
    if (userProfile.user_type !== 'professional') {
      return NextResponse.json(
        { error: 'Professional account required' },
        { status: 403 }
      )
    }

    // Get form ID from query params
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')
    const isPreview = searchParams.get('preview') === 'true'

    if (!formId || !formIdMapping[formId]) {
      return NextResponse.json(
        { error: 'Invalid form ID' },
        { status: 400 }
      )
    }

    // Get practice details based on preview/download mode
    let practiceDetails = {
      practiceName: 'Preview Only',
      practiceAddress: 'Professional verification required for customization',
      professionalName: 'Dr. Professional',
      gdcNumber: 'XXXXX',
    }
    
    if (!isPreview) {
      // For downloads, check verification and get real practice details
      const { createServerSupabaseClient } = await import('@/lib/supabase-auth')
      const supabase = await createServerSupabaseClient()
      
      const { data: verification } = await supabase
        .from('professional_verifications')
        .select('*')
        .eq('user_id', userProfile.id) // Use the Supabase profile ID
        .eq('verification_status', 'verified')
        .single()

      if (!verification) {
        return NextResponse.json(
          { error: 'Professional verification required for downloads' },
          { status: 403 }
        )
      }
      
      practiceDetails = {
        practiceName: verification.practice_name || userProfile.name || 'Dental Practice',
        practiceAddress: verification.practice_address || '123 High Street, London, UK',
        professionalName: verification.full_name || userProfile.name || 'Dr. Professional',
        gdcNumber: verification.gdc_number || 'XXXXX',
      }
    }

    // Generate PDF
    const pdfBuffer = await generateConsentFormPDF(
      formIdMapping[formId],
      practiceDetails
    )

    // Return PDF
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    
    if (!isPreview) {
      headers.set(
        'Content-Disposition',
        `attachment; filename="${formIdMapping[formId]}_consent_form.pdf"`
      )
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}