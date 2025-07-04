import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

interface PracticeDetails {
  practiceName: string
  practiceAddress: string
  practicePhone?: string
  practiceWebsite?: string
}

const educationMaterialTemplates: Record<string, any> = {
  'oral-hygiene-basics': {
    title: 'Daily Oral Hygiene Guide',
    subtitle: 'Keep Your Teeth and Gums Healthy',
    sections: [
      {
        heading: 'Brushing Your Teeth',
        content: [
          'Brush twice daily for 2 minutes each time',
          'Use fluoride toothpaste (1450ppm for adults)',
          'Use gentle circular motions',
          'Brush all surfaces: outer, inner, and chewing',
          'Don\'t forget your tongue!',
          'Replace your toothbrush every 3 months'
        ]
      },
      {
        heading: 'Flossing',
        content: [
          'Floss once daily, preferably before bedtime',
          'Use about 45cm (18 inches) of floss',
          'Wrap around middle fingers, guide with index fingers',
          'Gently slide between teeth in a C-shape',
          'Clean both sides of each tooth',
          'Use fresh sections of floss for each tooth'
        ]
      },
      {
        heading: 'Mouthwash',
        content: [
          'Use after brushing and flossing',
          'Choose alcohol-free options for daily use',
          'Swish for 30 seconds',
          'Don\'t rinse with water afterwards',
          'Wait 30 minutes before eating or drinking'
        ]
      },
      {
        heading: 'Diet Tips',
        content: [
          'Limit sugary snacks and drinks',
          'Drink water throughout the day',
          'Eat calcium-rich foods',
          'Choose tooth-friendly snacks like cheese and vegetables',
          'Avoid frequent snacking between meals'
        ]
      }
    ],
    footer: 'Schedule regular dental check-ups every 6 months'
  },
  'post-extraction-care': {
    title: 'After Your Tooth Extraction',
    subtitle: 'Important Care Instructions',
    sections: [
      {
        heading: 'First 24 Hours',
        content: [
          'Bite on gauze for 30-45 minutes',
          'Rest and avoid strenuous activity',
          'Don\'t rinse, spit, or use straws',
          'Apply ice pack (20 minutes on, 20 minutes off)',
          'Take prescribed pain medication as directed',
          'Eat soft, cool foods'
        ]
      },
      {
        heading: 'Days 2-3',
        content: [
          'Gently rinse with warm salt water (1/2 teaspoon salt in warm water)',
          'Rinse after meals and before bed',
          'Continue soft diet',
          'Brush carefully, avoiding extraction site',
          'Some swelling and discomfort is normal'
        ]
      },
      {
        heading: 'When to Call Us',
        content: [
          'Bleeding that won\'t stop after 4 hours',
          'Severe pain not relieved by medication',
          'Fever or signs of infection',
          'Difficulty swallowing or breathing',
          'Numbness lasting more than 6 hours',
          'Excessive swelling after 3 days'
        ]
      },
      {
        heading: 'What to Avoid',
        content: [
          'Smoking (delays healing)',
          'Alcohol for 24 hours',
          'Hot drinks for 24 hours',
          'Vigorous rinsing',
          'Touching the wound with tongue or fingers',
          'Hard or crunchy foods for 1 week'
        ]
      }
    ],
    footer: 'If you have any concerns, please contact us immediately'
  }
}

export async function generateEducationMaterialPDF(
  materialId: string,
  practiceDetails: PracticeDetails
): Promise<Buffer> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Add a page
  const page = pdfDoc.addPage([612, 792]) // Letter size
  const { width, height } = page.getSize()

  // Get template
  const template = educationMaterialTemplates[materialId] || educationMaterialTemplates['oral-hygiene-basics']

  let yPosition = height - 50

  // Header with practice branding
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: rgb(0.95, 0.95, 0.95),
  })

  page.drawText(practiceDetails.practiceName, {
    x: 50,
    y: height - 40,
    size: 16,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  })

  page.drawText(practiceDetails.practiceAddress, {
    x: 50,
    y: height - 60,
    size: 10,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3),
  })

  yPosition = height - 120

  // Title
  page.drawText(template.title, {
    x: 50,
    y: yPosition,
    size: 24,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  })
  yPosition -= 30

  // Subtitle
  if (template.subtitle) {
    page.drawText(template.subtitle, {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    })
    yPosition -= 40
  }

  // Sections
  for (const section of template.sections) {
    // Check if we need a new page
    if (yPosition < 150) {
      const newPage = pdfDoc.addPage([612, 792])
      yPosition = height - 50
    }

    // Section heading
    page.drawText(section.heading, {
      x: 50,
      y: yPosition,
      size: 16,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.4, 0.8),
    })
    yPosition -= 25

    // Section content
    for (const item of section.content) {
      // Wrap text if needed
      const maxWidth = width - 100
      const words = item.split(' ')
      let line = ''
      let lines = []

      for (const word of words) {
        const testLine = line + word + ' '
        const textWidth = helveticaFont.widthOfTextAtSize(testLine, 12)
        
        if (textWidth > maxWidth && line.length > 0) {
          lines.push(line.trim())
          line = word + ' '
        } else {
          line = testLine
        }
      }
      lines.push(line.trim())

      // Draw bullet point
      page.drawText('•', {
        x: 60,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      })

      // Draw wrapped lines
      for (let i = 0; i < lines.length; i++) {
        page.drawText(lines[i], {
          x: 75,
          y: yPosition - (i * 15),
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        })
      }

      yPosition -= (lines.length * 15) + 5
    }

    yPosition -= 20
  }

  // Footer
  if (template.footer) {
    // Draw footer box
    page.drawRectangle({
      x: 50,
      y: 60,
      width: width - 100,
      height: 40,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 1,
    })

    page.drawText(template.footer, {
      x: 60,
      y: 75,
      size: 12,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.4, 0.8),
    })
  }

  // Contact information at bottom
  const contactY = 30
  if (practiceDetails.practicePhone) {
    page.drawText(`Phone: ${practiceDetails.practicePhone}`, {
      x: 50,
      y: contactY,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  if (practiceDetails.practiceWebsite) {
    page.drawText(`Website: ${practiceDetails.practiceWebsite}`, {
      x: width / 2,
      y: contactY,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  // Serialize the PDF
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}