import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

interface PracticeDetails {
  practiceName: string
  practiceAddress: string
  practicePhone?: string
  practiceWebsite?: string
}

const educationMaterialTemplates: Record<string, any> = {
  'denture-care': {
    title: 'Caring for Your Dentures',
    subtitle: 'Keep Your Dentures Clean and Your Mouth Healthy',
    sections: [
      {
        heading: 'Daily Cleaning',
        content: [
          'Remove and rinse dentures after eating',
          'Brush dentures daily with soft brush and non-abrasive cleaner',
          'Never use regular toothpaste - it\'s too abrasive',
          'Clean over a towel or water-filled sink to prevent breakage',
          'Brush your gums, tongue, and palate with soft toothbrush',
          'Soak dentures overnight in denture solution'
        ]
      },
      {
        heading: 'Handling Your Dentures',
        content: [
          'Always handle with care - dentures can break if dropped',
          'Never use hot water - it can warp dentures',
          'Don\'t try to adjust or repair dentures yourself',
          'Keep dentures moist when not wearing them',
          'Never use bleach on dentures with metal attachments',
          'Store in a safe place away from children and pets'
        ]
      },
      {
        heading: 'Oral Health with Dentures',
        content: [
          'Remove dentures for at least 6-8 hours daily',
          'Massage your gums to improve circulation',
          'Check mouth regularly for sore spots or changes',
          'Maintain good nutrition with well-balanced diet',
          'Stay hydrated to prevent dry mouth',
          'Visit your dentist regularly for check-ups'
        ]
      },
      {
        heading: 'When to See Your Dentist',
        content: [
          'Dentures become loose or uncomfortable',
          'Sore spots or irritation that don\'t heal',
          'Changes in fit or bite',
          'Chips, cracks, or broken teeth',
          'Annual check-up for oral cancer screening',
          'Professional cleaning and adjustment'
        ]
      }
    ],
    footer: 'Well-maintained dentures can last 5-7 years with proper care'
  },
  'childrens-oral-health': {
    title: 'Your Child\'s Dental Health',
    subtitle: 'Building Healthy Habits for Life',
    sections: [
      {
        heading: 'Ages 0-2 Years',
        content: [
          'Clean gums with soft cloth before teeth appear',
          'Start brushing when first tooth appears',
          'Use smear of fluoride toothpaste (rice grain size)',
          'Never put baby to bed with bottle',
          'First dental visit by age 1',
          'Avoid sharing utensils to prevent cavity-causing bacteria'
        ]
      },
      {
        heading: 'Ages 3-6 Years',
        content: [
          'Use pea-sized amount of fluoride toothpaste',
          'Supervise brushing until child can tie shoes',
          'Brush twice daily for 2 minutes',
          'Start flossing when teeth touch',
          'Limit sugary snacks and drinks',
          'Consider dental sealants on permanent molars'
        ]
      },
      {
        heading: 'Preventing Tooth Decay',
        content: [
          'Establish regular brushing routine',
          'Make brushing fun with timers or songs',
          'Choose water over sugary drinks',
          'Offer healthy snacks like cheese and vegetables',
          'Regular dental check-ups every 6 months',
          'Ask about fluoride varnish treatments'
        ]
      },
      {
        heading: 'Common Concerns',
        content: [
          'Thumb sucking: Usually stops by age 4',
          'Teething: Use cold teething rings, not gels',
          'Dental injuries: Save knocked-out teeth in milk',
          'Fear of dentist: Read books about dental visits',
          'Tooth grinding: Often outgrown, mention to dentist',
          'Early tooth loss: May need space maintainer'
        ]
      }
    ],
    footer: 'Healthy habits started early last a lifetime!'
  },
  'gum-disease-prevention': {
    title: 'Preventing Gum Disease',
    subtitle: 'Keep Your Gums Healthy and Strong',
    sections: [
      {
        heading: 'What is Gum Disease?',
        content: [
          'Gingivitis: Early stage with red, swollen gums',
          'Periodontitis: Advanced stage affecting bone',
          'Caused by bacterial plaque buildup',
          'Can lead to tooth loss if untreated',
          'Linked to heart disease and diabetes',
          'Often painless in early stages'
        ]
      },
      {
        heading: 'Warning Signs',
        content: [
          'Bleeding when brushing or flossing',
          'Red, swollen, or tender gums',
          'Persistent bad breath or bad taste',
          'Gums pulling away from teeth',
          'Loose or shifting teeth',
          'Changes in bite or denture fit'
        ]
      },
      {
        heading: 'Prevention Steps',
        content: [
          'Brush twice daily with fluoride toothpaste',
          'Floss daily to remove plaque between teeth',
          'Use antimicrobial mouthwash',
          'Professional cleanings every 6 months',
          'Don\'t smoke - major risk factor',
          'Manage diabetes and other health conditions'
        ]
      },
      {
        heading: 'Risk Factors',
        content: [
          'Poor oral hygiene habits',
          'Smoking or tobacco use',
          'Diabetes',
          'Pregnancy hormonal changes',
          'Certain medications causing dry mouth',
          'Family history of gum disease'
        ]
      }
    ],
    footer: 'Early detection and treatment can reverse gum disease'
  },
  'dental-implant-aftercare': {
    title: 'Caring for Your Dental Implants',
    subtitle: 'Ensure Long-lasting Success',
    sections: [
      {
        heading: 'Immediate Post-Surgery (First Week)',
        content: [
          'Bite on gauze to control bleeding',
          'Apply ice packs to reduce swelling',
          'Take prescribed medications as directed',
          'Eat soft, cool foods only',
          'Avoid the surgical site when brushing',
          'No smoking - critical for healing'
        ]
      },
      {
        heading: 'Healing Phase (2-6 Months)',
        content: [
          'Maintain excellent oral hygiene',
          'Use special soft brush around implant',
          'Rinse with prescribed antimicrobial rinse',
          'Attend all follow-up appointments',
          'Report any unusual pain or movement',
          'Continue to avoid smoking'
        ]
      },
      {
        heading: 'Long-term Care',
        content: [
          'Brush and floss like natural teeth',
          'Use interdental brushes for hard-to-reach areas',
          'Professional cleanings every 3-6 months',
          'Annual X-rays to check bone levels',
          'Wear nightguard if you grind teeth',
          'Maintain healthy diet and lifestyle'
        ]
      },
      {
        heading: 'Protect Your Investment',
        content: [
          'Implants can last a lifetime with proper care',
          'Poor hygiene can cause peri-implantitis',
          'Regular check-ups are essential',
          'Report any changes immediately',
          'Avoid chewing extremely hard items',
          'Keep adjacent teeth healthy too'
        ]
      }
    ],
    footer: 'Your implant success depends on your daily care'
  },
  'orthodontic-care': {
    title: 'Orthodontic Care Instructions',
    subtitle: 'Getting the Best Results from Your Braces',
    sections: [
      {
        heading: 'Oral Hygiene with Braces',
        content: [
          'Brush after every meal and snack',
          'Use orthodontic toothbrush or electric brush',
          'Thread floss under wires daily',
          'Use interdental brushes for brackets',
          'Rinse with fluoride mouthwash nightly',
          'Consider water flosser for easier cleaning'
        ]
      },
      {
        heading: 'Foods to Avoid',
        content: [
          'Hard foods: nuts, hard candy, ice',
          'Sticky foods: caramel, toffee, gum',
          'Chewy foods: bagels, tough meats',
          'Crunchy foods: popcorn, chips',
          'Cut apples and carrots into small pieces',
          'Avoid biting into foods with front teeth'
        ]
      },
      {
        heading: 'Managing Discomfort',
        content: [
          'Soreness normal for 3-5 days after adjustments',
          'Use orthodontic wax on irritating brackets',
          'Rinse with warm salt water',
          'Take over-the-counter pain relief if needed',
          'Eat soft foods when sore',
          'Cold foods can help reduce discomfort'
        ]
      },
      {
        heading: 'Emergency Care',
        content: [
          'Loose bracket: Cover with wax, call office',
          'Poking wire: Push back with eraser, apply wax',
          'Lost separator: Call if more than 2 days before appointment',
          'Severe pain: Contact orthodontist immediately',
          'Keep emergency kit with wax, floss, tweezers',
          'Save any broken pieces to show orthodontist'
        ]
      }
    ],
    footer: 'Follow instructions carefully for best results and shortest treatment time'
  },
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