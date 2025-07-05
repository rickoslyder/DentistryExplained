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

    // Get practice details (in production, this would come from the user's practice profile)
    const practiceDetails = {
      practiceName: userProfile.name || 'Dental Practice',
      practiceAddress: '123 High Street, London, UK',
      professionalName: userProfile.name || 'Dr. Professional',
      gdcNumber: '123456', // In production, get from professional_verifications table
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