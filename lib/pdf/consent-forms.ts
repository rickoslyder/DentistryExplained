import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

interface PracticeDetails {
  practiceName: string
  practiceAddress: string
  professionalName: string
  gdcNumber: string
}

const consentFormTemplates: Record<string, any> = {
  'dental-implants': {
    title: 'Consent for Dental Implant Placement',
    content: `
I understand that I will be having one or more dental implants placed.

The procedure involves:
• Surgical placement of titanium implant(s) into the jawbone
• A healing period of 3-6 months for osseointegration
• Placement of abutment and crown/restoration
• Multiple appointments over several months

I understand the risks include:
• Implant failure (5-10% risk)
• Infection at implant site
• Injury to surrounding structures (nerves, blood vessels, sinus)
• Need for bone grafting
• Prolonged healing
• Rejection of the implant
• Need for additional procedures

Success rates are typically 90-95% but depend on:
• Bone quality and quantity
• Oral hygiene maintenance
• Smoking status
• Overall health conditions

Alternative treatments have been discussed including:
• Fixed bridge
• Removable denture
• No treatment

I understand the importance of:
• Excellent oral hygiene
• Regular maintenance visits
• Not smoking
• Following post-operative instructions

I consent to the procedure described above.
    `,
    fields: [
      { label: 'Patient Name', type: 'text' },
      { label: 'Date of Birth', type: 'date' },
      { label: 'Implant Site(s)', type: 'text' },
      { label: 'Number of Implants', type: 'text' },
      { label: 'Bone Grafting Required', type: 'checkbox' },
      { label: 'Date', type: 'date' },
      { label: 'Patient Signature', type: 'signature' },
      { label: 'Clinician Signature', type: 'signature' },
    ]
  },
  'orthodontics': {
    title: 'Consent for Orthodontic Treatment',
    content: `
I understand that I/my child will be having orthodontic treatment (braces/aligners).

The treatment involves:
• Placement of fixed braces or provision of clear aligners
• Regular adjustment appointments (every 4-8 weeks)
• Treatment duration of approximately _____ months
• Retention phase following active treatment

I understand the risks and limitations include:
• Root resorption (shortening)
• Tooth decay if oral hygiene is poor
• Gum disease or recession
• Temporomandibular joint (TMJ) problems
• Relapse if retainers not worn
• Need for tooth extraction
• Allergic reactions to materials

I understand my responsibilities:
• Maintain excellent oral hygiene
• Attend all scheduled appointments
• Avoid hard, sticky, or sugary foods
• Wear elastics/appliances as instructed
• Wear retainers as directed after treatment

Treatment goals and limitations have been explained, including:
• Improvement in tooth alignment and bite
• Possible need for additional procedures
• Retention is lifelong to prevent relapse

I consent to the orthodontic treatment as discussed.
    `,
    fields: [
      { label: 'Patient Name', type: 'text' },
      { label: 'Date of Birth', type: 'date' },
      { label: 'Treatment Type', type: 'text' },
      { label: 'Estimated Duration', type: 'text' },
      { label: 'Extractions Required', type: 'checkbox' },
      { label: 'Date', type: 'date' },
      { label: 'Patient/Parent Signature', type: 'signature' },
      { label: 'Clinician Signature', type: 'signature' },
    ]
  },
  'cosmetic-veneers': {
    title: 'Consent for Porcelain Veneers',
    content: `
I understand that I will be having porcelain veneers placed on my teeth.

The procedure involves:
• Removal of small amount of tooth enamel (0.5-0.7mm)
• Taking impressions or digital scans
• Temporary veneers while permanents are made
• Bonding of custom porcelain veneers

I understand:
• This is an irreversible procedure
• Natural tooth structure will be permanently removed
• Veneers may need replacement in 10-15 years
• Color match is done carefully but perfect match cannot be guaranteed

Risks include:
• Tooth sensitivity (usually temporary)
• Veneer chipping or fracture
• Need for root canal treatment (rare)
• Gum irritation
• Color mismatch or changes over time
• Debonding requiring re-cementation

Maintenance requirements:
• Good oral hygiene essential
• Avoid biting hard objects
• Wear nightguard if grinding teeth
• Regular dental check-ups
• Professional cleaning recommended

Alternative treatments discussed:
• Tooth whitening
• Composite bonding
• Crowns
• Orthodontic treatment
• No treatment

I consent to the veneer treatment as described.
    `,
    fields: [
      { label: 'Patient Name', type: 'text' },
      { label: 'Date of Birth', type: 'date' },
      { label: 'Teeth to be Veneered', type: 'text' },
      { label: 'Number of Veneers', type: 'text' },
      { label: 'Shade Selected', type: 'text' },
      { label: 'Date', type: 'date' },
      { label: 'Patient Signature', type: 'signature' },
      { label: 'Clinician Signature', type: 'signature' },
    ]
  },
  'teeth-whitening': {
    title: 'Consent for Teeth Whitening Treatment',
    content: `
I understand that I will be having professional teeth whitening treatment.

The treatment involves:
• Professional cleaning before whitening
• Custom tray fabrication (for home whitening)
• Application of whitening gel containing hydrogen/carbamide peroxide
• Multiple applications over days/weeks

I understand:
• Results vary between individuals
• Not all discoloration can be improved
• Existing fillings/crowns will not whiten
• Results are not permanent (6 months - 2 years)

Possible side effects:
• Tooth sensitivity (common, usually temporary)
• Gum irritation if gel contacts soft tissues
• Uneven whitening
• Temporary increase in sensitivity to hot/cold

Factors affecting results:
• Initial tooth color
• Type of staining
• Age of patient
• Dietary habits
• Smoking

Post-treatment care:
• Avoid staining foods/drinks for 48 hours
• Maintain good oral hygiene
• Regular touch-up treatments may be needed
• Use sensitivity toothpaste if needed

I have been informed of alternative treatments and understand that results cannot be guaranteed.

I consent to teeth whitening treatment.
    `,
    fields: [
      { label: 'Patient Name', type: 'text' },
      { label: 'Date of Birth', type: 'date' },
      { label: 'Treatment Type', type: 'text' },
      { label: 'Current Shade', type: 'text' },
      { label: 'Target Shade', type: 'text' },
      { label: 'Date', type: 'date' },
      { label: 'Patient Signature', type: 'signature' },
      { label: 'Clinician Signature', type: 'signature' },
    ]
  },
  'sedation': {
    title: 'Consent for Sedation',
    content: `
I consent to sedation for my dental treatment.

Type of sedation:
□ Inhalation sedation (nitrous oxide/oxygen)
□ Oral sedation
□ Intravenous (IV) sedation

I understand:
• I will be conscious but relaxed
• I may not remember parts of the treatment
• My protective reflexes will be maintained
• Vital signs will be monitored throughout

Pre-sedation instructions followed:
• No food/drink for _____ hours before (if applicable)
• Arranged responsible adult escort
• No driving/operating machinery for 24 hours
• No important decisions for 24 hours
• Medications disclosed to dentist

Risks include:
• Nausea or vomiting
• Headache
• Prolonged drowsiness
• Allergic reaction (rare)
• Respiratory depression (rare)
• Failed sedation requiring rescheduling

Medical history reviewed including:
• Current medications
• Allergies
• Previous sedation experiences
• Respiratory conditions
• Pregnancy/breastfeeding status

I confirm I have disclosed my full medical history and understand the risks and benefits of sedation.

I consent to sedation as described above.
    `,
    fields: [
      { label: 'Patient Name', type: 'text' },
      { label: 'Date of Birth', type: 'date' },
      { label: 'Type of Sedation', type: 'text' },
      { label: 'Procedure to be Performed', type: 'text' },
      { label: 'Escort Name', type: 'text' },
      { label: 'Date', type: 'date' },
      { label: 'Patient Signature', type: 'signature' },
      { label: 'Clinician Signature', type: 'signature' },
    ]
  },
  'crown-bridge': {
    title: 'Consent for Crown and Bridge Treatment',
    content: `
I understand that I will be having crown/bridge treatment.

The procedure involves:
• Preparation (shaping) of teeth
• Impressions or digital scans
• Temporary crown/bridge placement
• Permanent crown/bridge cementation
• Usually requires 2-3 appointments

I understand:
• Tooth preparation is irreversible
• Significant tooth structure will be removed
• Temporary restoration may come off
• Final restoration color/shape subject to approval

Risks include:
• Need for root canal treatment (5-15% risk)
• Sensitivity to hot/cold
• Restoration failure/fracture
• Decay under restoration
• Gum recession
• Bite adjustment needed

For bridges specifically:
• Supporting teeth bear extra load
• Special cleaning required underneath
• May need replacement in 10-15 years

Materials options discussed:
• Porcelain-fused-to-metal
• All-ceramic/porcelain
• Gold alloy
• Zirconia

Alternative treatments discussed:
• Dental implant
• Removable denture
• No treatment

I understand the importance of maintenance and regular check-ups.

I consent to the crown/bridge treatment as described.
    `,
    fields: [
      { label: 'Patient Name', type: 'text' },
      { label: 'Date of Birth', type: 'date' },
      { label: 'Teeth Involved', type: 'text' },
      { label: 'Type of Restoration', type: 'text' },
      { label: 'Material Chosen', type: 'text' },
      { label: 'Date', type: 'date' },
      { label: 'Patient Signature', type: 'signature' },
      { label: 'Clinician Signature', type: 'signature' },
    ]
  },
  'periodontal-surgery': {
    title: 'Consent for Periodontal Surgery',
    content: `
I understand that I require periodontal (gum) surgery.

The procedure involves:
• Local anaesthetic administration
• Surgical access to roots and bone
• Removal of infected tissue
• Root surface cleaning
• Possible bone grafting or regeneration procedures
• Suturing of gum tissue

Goals of treatment:
• Reduce pocket depths
• Regenerate lost tissue (where possible)
• Improve long-term tooth prognosis
• Facilitate oral hygiene

I understand the risks:
• Post-operative pain and swelling
• Bleeding
• Infection
• Gum recession and sensitivity
• Spaces between teeth
• Tooth mobility (usually temporary)
• Treatment failure requiring extraction

Post-operative requirements:
• Prescribed medications as directed
• Special oral hygiene instructions
• Dietary restrictions
• No smoking (critical for healing)
• Multiple follow-up appointments
• Ongoing periodontal maintenance

Factors affecting success:
• Oral hygiene compliance
• Smoking cessation
• Systemic health (diabetes control)
• Regular maintenance visits

Alternative treatments discussed including extraction and no treatment.

I consent to periodontal surgery as described.
    `,
    fields: [
      { label: 'Patient Name', type: 'text' },
      { label: 'Date of Birth', type: 'date' },
      { label: 'Areas to be Treated', type: 'text' },
      { label: 'Bone Graft Required', type: 'checkbox' },
      { label: 'Regenerative Materials', type: 'text' },
      { label: 'Date', type: 'date' },
      { label: 'Patient Signature', type: 'signature' },
      { label: 'Clinician Signature', type: 'signature' },
    ]
  },
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