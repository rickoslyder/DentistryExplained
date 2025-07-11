/**
 * Smart template system for MDX components
 * Suggests relevant components based on content context
 */

export interface SmartTemplate {
  id: string
  name: string
  description: string
  keywords: string[]
  template: string
  category: 'medical' | 'educational' | 'interactive' | 'general' | 'clinical'
  props?: {
    name: string
    type: string
    description: string
    required?: boolean
    example?: string
  }[]
}

export const smartTemplates: SmartTemplate[] = [
  // Dental Visualization Templates
  {
    id: 'tooth-diagram',
    name: 'Tooth Diagram',
    description: 'Interactive tooth diagram showing dental conditions',
    keywords: ['tooth', 'teeth', 'diagram', 'dental', 'visualization'],
    template: `<ToothDiagram 
  teeth={[
    { number: 8, status: 'healthy', label: 'Central Incisor' },
    { number: 9, status: 'cavity', label: 'Lateral Incisor' },
    { number: 10, status: 'filled', label: 'Canine' },
    { number: 11, status: 'crown', label: 'First Premolar' }
  ]}
  interactive={true}
/>`,
    category: 'clinical',
    props: [
      {
        name: 'teeth',
        type: 'Array<{number: number, status: string, label: string}>',
        description: 'Array of tooth objects with number, status, and label',
        required: true,
        example: '[{number: 8, status: "healthy", label: "Central Incisor"}]'
      },
      {
        name: 'interactive',
        type: 'boolean',
        description: 'Enable click interactions on teeth',
        required: false,
        example: 'true'
      }
    ]
  },
  
  // Medical Emergency Templates
  {
    id: 'emergency-alert',
    name: 'Emergency Warning',
    description: 'For urgent medical situations',
    keywords: ['emergency', 'urgent', 'immediate', 'danger', 'warning', 'seek help'],
    template: `<Alert type="emergency">
  <strong>Dental Emergency</strong>
  If you're experiencing severe pain, facial swelling, or uncontrolled bleeding, seek immediate medical attention.
</Alert>`,
    category: 'medical',
    props: [
      {
        name: 'type',
        type: '"info" | "warning" | "error" | "emergency" | "tip" | "clinical-note"',
        description: 'Alert type determines styling and icon',
        required: true,
        example: '"emergency"'
      },
      {
        name: 'children',
        type: 'ReactNode',
        description: 'Content to display inside the alert',
        required: true,
        example: '<strong>Alert Title</strong>\nAlert message content'
      }
    ]
  },
  {
    id: 'symptom-assessment',
    name: 'Symptom Assessment',
    description: 'Help patients evaluate their symptoms',
    keywords: ['pain', 'symptom', 'assessment', 'rate', 'severity', 'discomfort'],
    template: `<SymptomSeverityScale 
  title="Rate Your Current Symptoms"
  description="Use this scale to help your dentist understand your pain level"
  showGuide={true}
/>`,
    category: 'medical',
    props: [
      {
        name: 'title',
        type: 'string',
        description: 'Title displayed above the severity scale',
        required: false,
        example: '"Rate Your Current Symptoms"'
      },
      {
        name: 'description',
        type: 'string',
        description: 'Helper text explaining the scale',
        required: false,
        example: '"Use this scale to help your dentist understand your pain level"'
      },
      {
        name: 'showGuide',
        type: 'boolean',
        description: 'Show guide explaining each pain level',
        required: false,
        example: 'true'
      }
    ]
  },
  
  // Treatment Information Templates
  {
    id: 'treatment-options',
    name: 'Treatment Comparison',
    description: 'Compare different treatment approaches',
    keywords: ['treatment', 'options', 'comparison', 'alternatives', 'choices', 'procedures'],
    template: `<TreatmentComparisonTable 
  title="Treatment Options for [Condition]"
  description="Compare the available treatments to make an informed decision"
  treatments={[
    {
      name: "Conservative Treatment",
      duration: "1 visit",
      cost: "£50-150",
      successRate: "85%",
      nhsAvailable: true,
      pros: ["Less invasive", "Lower cost", "Quick recovery"],
      cons: ["May not be permanent", "Limited to minor issues"],
      painLevel: "low",
      recoveryTime: "1-2 days"
    },
    {
      name: "Advanced Treatment",
      duration: "2-3 visits",
      cost: "£300-600",
      successRate: "95%",
      nhsAvailable: false,
      pros: ["Long-lasting results", "Addresses root cause", "Better aesthetics"],
      cons: ["Higher cost", "More time required", "Longer recovery"],
      painLevel: "medium",
      recoveryTime: "1 week"
    }
  ]}
/>`,
    category: 'medical',
    props: [
      {
        name: 'title',
        type: 'string',
        description: 'Title of the comparison table',
        required: false,
        example: '"Treatment Options for Root Canal"'
      },
      {
        name: 'description',
        type: 'string',
        description: 'Description text below the title',
        required: false,
        example: '"Compare the available treatments"'
      },
      {
        name: 'treatments',
        type: 'Array<Treatment>',
        description: 'Array of treatment objects with name, duration, cost, successRate, nhsAvailable, pros, cons, painLevel, recoveryTime',
        required: true,
        example: '[{name: "Option 1", duration: "1 visit", cost: "£100", ...}]'
      }
    ]
  },
  {
    id: 'procedure-timeline',
    name: 'Treatment Timeline',
    description: 'Show the stages of a dental procedure',
    keywords: ['procedure', 'timeline', 'stages', 'steps', 'process', 'journey'],
    template: `<Timeline>
  <TimelineItem date="Consultation" title="Initial Assessment">
    Examination and diagnosis of your condition
  </TimelineItem>
  <TimelineItem date="Week 1" title="Treatment Planning">
    Develop a personalized treatment plan
  </TimelineItem>
  <TimelineItem date="Week 2-3" title="Active Treatment">
    Perform the necessary procedures
  </TimelineItem>
  <TimelineItem date="Week 4+" title="Follow-up Care">
    Monitor healing and ensure success
  </TimelineItem>
</Timeline>`,
    category: 'educational',
    props: [
      {
        name: 'children',
        type: 'ReactNode (TimelineItem components)',
        description: 'TimelineItem components to display in sequence',
        required: true,
        example: '<TimelineItem date="Day 1" title="Step 1">Description</TimelineItem>'
      }
    ]
  },
  
  // Cost and Financial Templates
  {
    id: 'cost-breakdown',
    name: 'Cost Breakdown Table',
    description: 'Detailed cost information for treatments',
    keywords: ['cost', 'price', 'fee', 'payment', 'nhs', 'private', 'expense'],
    template: `<CostTable costs={[
  { item: "Initial Consultation", cost: "£50-80", nhs: true },
  { item: "Diagnostic X-rays", cost: "£25-50", nhs: true },
  { item: "Basic Treatment", cost: "£65.20", nhs: true },
  { item: "Advanced Treatment", cost: "£282.80", nhs: true },
  { item: "Private Alternative", cost: "£300-500", nhs: false }
]} />`,
    category: 'general',
    props: [
      {
        name: 'costs',
        type: 'Array<{item: string, cost: string, nhs: boolean}>',
        description: 'Array of cost items with item name, cost range, and NHS availability',
        required: true,
        example: '[{item: "Consultation", cost: "£50-80", nhs: true}]'
      }
    ]
  },
  
  // Educational Templates
  {
    id: 'procedure-steps',
    name: 'Step-by-Step Guide',
    description: 'Explain a procedure in simple steps',
    keywords: ['how', 'steps', 'guide', 'instructions', 'procedure', 'process'],
    template: `<ProcedureSteps>
  <li>Initial preparation and local anaesthetic</li>
  <li>Removal of decay or damaged tissue</li>
  <li>Cleaning and shaping the area</li>
  <li>Placement of filling or restoration</li>
  <li>Final adjustments and polishing</li>
</ProcedureSteps>`,
    category: 'educational',
    props: [
      {
        name: 'children',
        type: 'ReactNode (li elements)',
        description: 'List items (<li>) containing procedure steps',
        required: true,
        example: '<li>Step 1: Prepare the area</li>'
      }
    ]
  },
  {
    id: 'clinical-note',
    name: 'Clinical Information',
    description: 'Professional guidance or technical details',
    keywords: ['clinical', 'professional', 'technical', 'medical', 'scientific'],
    template: `<Alert type="clinical-note">
  <strong>Clinical Note:</strong> This information is based on current clinical guidelines and evidence-based practice.
</Alert>`,
    category: 'medical',
    props: [
      {
        name: 'type',
        type: '"info" | "warning" | "error" | "emergency" | "tip" | "clinical-note"',
        description: 'Alert type determines styling and icon',
        required: true,
        example: '"clinical-note"'
      },
      {
        name: 'children',
        type: 'ReactNode',
        description: 'Content to display inside the alert',
        required: true,
        example: '<strong>Note:</strong> Clinical information here'
      }
    ]
  },
  {
    id: 'prevention-tips',
    name: 'Prevention Tips',
    description: 'Advice for preventing dental problems',
    keywords: ['prevent', 'avoid', 'tips', 'advice', 'maintenance', 'care'],
    template: `<Alert type="tip">
  <strong>Prevention Tips:</strong>
  <ul>
    <li>Brush twice daily with fluoride toothpaste</li>
    <li>Floss daily to remove plaque between teeth</li>
    <li>Visit your dentist regularly for check-ups</li>
    <li>Limit sugary foods and drinks</li>
  </ul>
</Alert>`,
    category: 'educational',
    props: [
      {
        name: 'type',
        type: '"info" | "warning" | "error" | "emergency" | "tip" | "clinical-note"',
        description: 'Alert type determines styling and icon',
        required: true,
        example: '"tip"'
      },
      {
        name: 'children',
        type: 'ReactNode',
        description: 'Content to display inside the alert',
        required: true,
        example: '<strong>Tips:</strong><ul><li>Tip 1</li></ul>'
      }
    ]
  },
  
  // Interactive Templates
  {
    id: 'dental-chart',
    name: 'Interactive Dental Chart',
    description: 'Visual representation of dental conditions',
    keywords: ['tooth', 'teeth', 'chart', 'diagram', 'visual', 'map'],
    template: `<InteractiveToothChart 
  title="Dental Examination Results"
  description="Click on any tooth to see details"
  teeth={[
    { id: 16, condition: "healthy", notes: "No issues detected" },
    { id: 14, condition: "filling", notes: "Composite filling placed 2023" },
    { id: 27, condition: "cavity", notes: "Small cavity requiring treatment" }
  ]}
  showLegend={true}
/>`,
    category: 'interactive',
    props: [
      {
        name: 'title',
        type: 'string',
        description: 'Chart title',
        required: false,
        example: '"Dental Examination Results"'
      },
      {
        name: 'description',
        type: 'string',
        description: 'Helper text below title',
        required: false,
        example: '"Click on any tooth to see details"'
      },
      {
        name: 'teeth',
        type: 'Array<{id: number, condition: string, notes: string}>',
        description: 'Array of tooth data with id, condition, and notes',
        required: false,
        example: '[{id: 16, condition: "healthy", notes: "No issues"}]'
      },
      {
        name: 'showLegend',
        type: 'boolean',
        description: 'Show condition color legend',
        required: false,
        example: 'true'
      },
      {
        name: 'onToothClick',
        type: 'function',
        description: 'Callback when a tooth is clicked',
        required: false,
        example: '(toothId) => console.log(toothId)'
      }
    ]
  },
  {
    id: 'faq-section',
    name: 'Frequently Asked Questions',
    description: 'Common questions and answers',
    keywords: ['faq', 'question', 'answer', 'common', 'frequently', 'asked'],
    template: `<FAQ question="How long will the treatment take?">
  Treatment duration varies depending on the complexity, but typically takes 30-60 minutes per appointment.
</FAQ>

<FAQ question="Will it hurt?">
  Modern dental techniques and anaesthetics ensure minimal discomfort. Most patients experience little to no pain during treatment.
</FAQ>

<FAQ question="What are the aftercare instructions?">
  Avoid eating for 2 hours after treatment, maintain good oral hygiene, and follow any specific instructions from your dentist.
</FAQ>`,
    category: 'educational',
    props: [
      {
        name: 'question',
        type: 'string',
        description: 'The question being asked',
        required: true,
        example: '"How long will it take?"'
      },
      {
        name: 'children',
        type: 'ReactNode',
        description: 'The answer content',
        required: true,
        example: 'The treatment typically takes 30-60 minutes.'
      }
    ]
  },
  {
    id: 'smart-faq',
    name: 'Smart FAQ Accordion',
    description: 'Categorized FAQs with collapsible sections',
    keywords: ['faq', 'accordion', 'categorized', 'smart', 'organized'],
    template: `<SmartFAQ 
  faqs={[
    {
      question: "What is the cost of treatment?",
      answer: "Treatment costs vary depending on the procedure. NHS Band 1 covers examinations (£25.80), Band 2 covers fillings and extractions (£70.70), and Band 3 covers crowns and dentures (£306.80).",
      category: "cost"
    },
    {
      question: "How often should I visit the dentist?",
      answer: "Most people should visit their dentist every 6-12 months for check-ups. Your dentist will advise on the best frequency based on your oral health.",
      category: "general"
    },
    {
      question: "What should I do in a dental emergency?",
      answer: "For severe pain, swelling, or trauma, contact your dentist immediately or call NHS 111. For life-threatening emergencies, go to A&E.",
      category: "emergency"
    }
  ]}
/>`,
    category: 'educational',
    props: [
      {
        name: 'faqs',
        type: 'Array<{question: string, answer: string, category: string}>',
        description: 'Array of FAQ objects with question, answer, and category',
        required: true,
        example: '[{question: "How much?", answer: "£50", category: "cost"}]'
      }
    ]
  },
  
  // Timeline and Process Templates
  {
    id: 'branching-timeline',
    name: 'Branching Timeline',
    description: 'Show treatment stages with decision points',
    keywords: ['timeline', 'process', 'stages', 'workflow', 'branching', 'decision'],
    template: `<BranchingTimeline 
  stages={[
    {
      title: "Initial Consultation",
      description: "Comprehensive oral examination and X-rays",
      options: ["Proceed with treatment", "Seek second opinion", "Delay treatment"]
    },
    {
      title: "Treatment Planning",
      description: "Discuss treatment options and create personalized plan",
      options: ["Conservative approach", "Comprehensive treatment"]
    },
    {
      title: "Active Treatment",
      description: "Implementation of agreed treatment plan"
    },
    {
      title: "Follow-up Care",
      description: "Regular check-ups and maintenance"
    }
  ]}
/>`,
    category: 'interactive',
    props: [
      {
        name: 'stages',
        type: 'Array<{title: string, description: string, options?: string[]}>',
        description: 'Array of timeline stages with title, description, and optional branching options',
        required: true,
        example: '[{title: "Step 1", description: "First step", options: ["Option A", "Option B"]}]'
      }
    ]
  },
  
  // Medication Information Templates
  {
    id: 'medication-card',
    name: 'Medication Card',
    description: 'Display medication information clearly',
    keywords: ['medication', 'prescription', 'drug', 'medicine', 'dosage'],
    template: `<MedicationCard 
  name="Amoxicillin"
  dosage="500mg"
  frequency="Three times daily"
  duration="7 days"
  instructions="Take with or after food. Complete the full course even if symptoms improve."
/>`,
    category: 'medical',
    props: [
      {
        name: 'name',
        type: 'string',
        description: 'Medication name',
        required: true,
        example: '"Amoxicillin"'
      },
      {
        name: 'dosage',
        type: 'string',
        description: 'Dosage amount',
        required: true,
        example: '"500mg"'
      },
      {
        name: 'frequency',
        type: 'string',
        description: 'How often to take',
        required: true,
        example: '"Three times daily"'
      },
      {
        name: 'duration',
        type: 'string',
        description: 'Treatment duration',
        required: true,
        example: '"7 days"'
      },
      {
        name: 'instructions',
        type: 'string',
        description: 'Additional instructions',
        required: false,
        example: '"Take with food"'
      }
    ]
  },
  
  // Cost and Pricing Templates
  {
    id: 'enhanced-cost-table',
    name: 'Enhanced Cost Table',
    description: 'Display treatment costs with calculator',
    keywords: ['cost', 'price', 'fee', 'charge', 'payment', 'nhs', 'private'],
    template: `<EnhancedCostTable 
  title="Treatment Cost Breakdown"
  items={[
    { item: "Initial Consultation", cost: "£50-80", nhs: true },
    { item: "X-rays (if required)", cost: "£30-60", nhs: true },
    { item: "Simple Filling", cost: "£70-150", nhs: true },
    { item: "Root Canal Treatment", cost: "£300-600", nhs: false },
    { item: "Crown", cost: "£400-800", nhs: false }
  ]}
  showCalculator={true}
/>`,
    category: 'general',
    props: [
      {
        name: 'title',
        type: 'string',
        description: 'Table title',
        required: false,
        example: '"Treatment Cost Breakdown"'
      },
      {
        name: 'items',
        type: 'Array<{item: string, cost: string, nhs: boolean}>',
        description: 'Array of cost items',
        required: true,
        example: '[{item: "Filling", cost: "£100", nhs: true}]'
      },
      {
        name: 'showCalculator',
        type: 'boolean',
        description: 'Show cost calculator below table',
        required: false,
        example: 'true'
      }
    ]
  },
  
  // Clinical Calculator Templates
  {
    id: 'bmi-calculator',
    name: 'BMI Calculator',
    description: 'Body Mass Index calculator',
    keywords: ['bmi', 'calculator', 'weight', 'height', 'obesity'],
    template: `<ClinicalCalculator type="bmi" title="BMI Calculator" />`,
    category: 'clinical',
    props: [
      {
        name: 'type',
        type: '"bmi" | "fluoride" | "dmft" | "anesthetic"',
        description: 'Type of calculator to display',
        required: true,
        example: '"bmi"'
      },
      {
        name: 'title',
        type: 'string',
        description: 'Calculator title',
        required: false,
        example: '"BMI Calculator"'
      }
    ]
  },
  {
    id: 'fluoride-calculator',
    name: 'Fluoride Dosage Calculator',
    description: 'Calculate recommended fluoride dosage by age',
    keywords: ['fluoride', 'dosage', 'calculator', 'pediatric'],
    template: `<ClinicalCalculator type="fluoride" title="Fluoride Dosage Calculator" />`,
    category: 'clinical',
    props: [
      {
        name: 'type',
        type: '"bmi" | "fluoride" | "dmft" | "anesthetic"',
        description: 'Type of calculator to display',
        required: true,
        example: '"fluoride"'
      },
      {
        name: 'title',
        type: 'string',
        description: 'Calculator title',
        required: false,
        example: '"Fluoride Dosage Calculator"'
      }
    ]
  },
  {
    id: 'dmft-calculator',
    name: 'DMFT Score Calculator',
    description: 'Calculate Decayed, Missing, Filled Teeth score',
    keywords: ['dmft', 'score', 'caries', 'risk', 'assessment'],
    template: `<ClinicalCalculator type="dmft" title="DMFT Score Calculator" />`,
    category: 'clinical',
    props: [
      {
        name: 'type',
        type: '"bmi" | "fluoride" | "dmft" | "anesthetic"',
        description: 'Type of calculator to display',
        required: true,
        example: '"dmft"'
      },
      {
        name: 'title',
        type: 'string',
        description: 'Calculator title',
        required: false,
        example: '"DMFT Score Calculator"'
      }
    ]
  },
  {
    id: 'anesthetic-calculator',
    name: 'Local Anesthetic Dosage',
    description: 'Calculate safe anesthetic dosage',
    keywords: ['anesthetic', 'lidocaine', 'dosage', 'calculator'],
    template: `<ClinicalCalculator type="anesthetic" title="Local Anesthetic Dosage Calculator" />`,
    category: 'clinical',
    props: [
      {
        name: 'type',
        type: '"bmi" | "fluoride" | "dmft" | "anesthetic"',
        description: 'Type of calculator to display',
        required: true,
        example: '"anesthetic"'
      },
      {
        name: 'title',
        type: 'string',
        description: 'Calculator title',
        required: false,
        example: '"Local Anesthetic Dosage Calculator"'
      }
    ]
  }
]

/**
 * Get suggested templates based on content keywords
 */
export function getSuggestedTemplates(content: string, limit: number = 5): SmartTemplate[] {
  const contentLower = content.toLowerCase()
  const words = contentLower.split(/\s+/)
  
  // Score each template based on keyword matches
  const scoredTemplates = smartTemplates.map(template => {
    let score = 0
    
    // Check for keyword matches
    template.keywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        score += 2
      }
      // Partial word matches
      words.forEach(word => {
        if (word.includes(keyword) || keyword.includes(word)) {
          score += 1
        }
      })
    })
    
    return { template, score }
  })
  
  // Sort by score and return top matches
  return scoredTemplates
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.template)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: SmartTemplate['category']): SmartTemplate[] {
  return smartTemplates.filter(template => template.category === category)
}

/**
 * Search templates by name or description
 */
export function searchTemplates(query: string): SmartTemplate[] {
  const queryLower = query.toLowerCase()
  return smartTemplates.filter(template => 
    template.name.toLowerCase().includes(queryLower) ||
    template.description.toLowerCase().includes(queryLower) ||
    template.keywords.some(keyword => keyword.includes(queryLower))
  )
}