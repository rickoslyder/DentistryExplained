import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

interface PracticeDetails {
  practiceName: string
  practiceAddress: string
  professionalName: string
  gdcNumber: string
}

const consentFormTemplates: Record<string, any> = {
  'extraction-simple': {
    title: 'Consent for Simple Tooth Extraction',
    content: `
I understand that I will be having a tooth extraction performed.

The procedure has been explained to me, including:
• The tooth/teeth to be removed
• The use of local anaesthetic
• Possible complications including:
  - Bleeding
  - Swelling
  - Pain
  - Infection
  - Dry socket
  - Damage to adjacent teeth
  - Nerve damage (rare)

Post-operative care instructions have been provided and explained.

I have had the opportunity to ask questions and these have been answered to my satisfaction.

I consent to the procedure described above.
    `,
    fields: [
      { label: 'Patient Name', type: 'text' },
      { label: 'Date of Birth', type: 'date' },
      { label: 'Tooth/Teeth to be extracted', type: 'text' },
      { label: 'Date', type: 'date' },
      { label: 'Patient Signature', type: 'signature' },
      { label: 'Clinician Signature', type: 'signature' },
    ]
  },
  'root-canal': {
    title: 'Consent for Root Canal Treatment',
    content: `
I understand that I will be having root canal treatment (endodontic therapy).

The procedure involves:
• Removing infected or damaged pulp from inside the tooth
• Cleaning and shaping the root canals
• Filling the canals with a biocompatible material
• Placing a temporary or permanent restoration

I understand the risks include:
• Failure of treatment requiring extraction
• Fracture of the tooth
• Perforation of the root
• Separated instruments
• Post-operative pain and swelling
• Need for additional treatment

Success rates are typically 85-95% but cannot be guaranteed.

Alternative treatments have been discussed including extraction.

I consent to the procedure described above.
    `,
    fields: [
      { label: 'Patient Name', type: 'text' },
      { label: 'Date of Birth', type: 'date' },
      { label: 'Tooth Number', type: 'text' },
      { label: 'Number of Canals', type: 'text' },
      { label: 'Date', type: 'date' },
      { label: 'Patient Signature', type: 'signature' },
      { label: 'Clinician Signature', type: 'signature' },
    ]
  }
}

export async function generateConsentFormPDF(
  formId: string,
  practiceDetails: PracticeDetails
): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Add a page
  const page = pdfDoc.addPage([612, 792]) // Letter size
  const { width, height } = page.getSize()

  // Get template
  const template = consentFormTemplates[formId] || consentFormTemplates['extraction-simple']

  let yPosition = height - 50

  // Practice header
  page.drawText(practiceDetails.practiceName, {
    x: 50,
    y: yPosition,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  })
  yPosition -= 20

  page.drawText(practiceDetails.practiceAddress, {
    x: 50,
    y: yPosition,
    size: 12,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3),
  })
  yPosition -= 40

  // Form title
  page.drawText(template.title, {
    x: 50,
    y: yPosition,
    size: 16,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  })
  yPosition -= 30

  // Content
  const lines = template.content.trim().split('\n')
  for (const line of lines) {
    if (line.trim()) {
      const fontSize = line.startsWith('•') ? 11 : 12
      const xOffset = line.startsWith('•') ? 70 : 50
      const font = line.startsWith('  -') ? helveticaFont : timesRomanFont
      
      page.drawText(line.trim(), {
        x: xOffset,
        y: yPosition,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      })
    }
    yPosition -= 18
  }

  yPosition -= 20

  // Fields
  for (const field of template.fields) {
    page.drawText(`${field.label}: _______________________________`, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })
    yPosition -= 30
  }

  // Footer
  yPosition = 50
  page.drawText(`Clinician: ${practiceDetails.professionalName} (GDC: ${practiceDetails.gdcNumber})`, {
    x: 50,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  })

  page.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, {
    x: width - 150,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  })

  // Serialize the PDF
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}