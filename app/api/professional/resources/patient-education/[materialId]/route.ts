import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/server'
import { generateEducationMaterialPDF } from '@/lib/pdf/education-materials'

export async function GET(
  req: NextRequest,
  { params }: { params: { materialId: string } }
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

    // Generate PDF based on material ID
    const pdfBuffer = await generateEducationMaterialPDF(params.materialId, {
      practiceName: verification.practice_name || 'Your Practice Name',
      practiceAddress: verification.practice_address || 'Your Practice Address',
      practicePhone: '', // Would come from practice profile
      practiceWebsite: '', // Would come from practice profile
    })

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${params.materialId}-patient-education.pdf"`,
      },
    })
  } catch (error) {
    console.error('Education material generation error:', error)
    return NextResponse.json({ error: 'Failed to generate education material' }, { status: 500 })
  }
}