import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/server'
import { generateConsentFormPDF } from '@/lib/pdf/consent-forms'

export async function GET(
  req: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Verify user is professionally verified
    const { data: verification } = await supabase
      .from('professional_verifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('verification_status', 'verified')
      .single()

    if (!verification) {
      return NextResponse.json({ error: 'Professional verification required' }, { status: 403 })
    }

    // Generate PDF based on form ID
    const pdfBuffer = await generateConsentFormPDF(params.formId, {
      practiceName: verification.practice_name || 'Your Practice Name',
      practiceAddress: verification.practice_address || 'Your Practice Address',
      professionalName: verification.full_name,
      gdcNumber: verification.gdc_number,
    })

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${params.formId}-consent-form.pdf"`,
      },
    })
  } catch (error) {
    console.error('Consent form generation error:', error)
    return NextResponse.json({ error: 'Failed to generate consent form' }, { status: 500 })
  }
}