import { smartTemplates } from './mdx-smart-templates'

export interface AISuggestion {
  type: 'component' | 'content' | 'correction' | 'enhancement'
  title: string
  description: string
  suggestion: string
  confidence: number // 0-1
  context?: string
}

// Medical terminology dictionary for spell checking
const medicalTerms = new Set([
  'orthodontic', 'periodontal', 'endodontic', 'prosthodontic', 
  'gingivitis', 'periodontitis', 'caries', 'occlusion',
  'malocclusion', 'bruxism', 'temporomandibular', 'apicoectomy',
  'prophylaxis', 'fluoride', 'sealant', 'amalgam', 'composite',
  'crown', 'bridge', 'denture', 'implant', 'extraction',
  'anaesthetic', 'analgesic', 'antibiotic', 'antiseptic'
])

// Common misspellings and corrections
const commonMisspellings: Record<string, string> = {
  'teath': 'teeth',
  'tooth ach': 'toothache',
  'tooth-ache': 'toothache',
  'gingervitis': 'gingivitis',
  'floride': 'fluoride',
  'anesthetic': 'anaesthetic', // UK spelling
  'anestezia': 'anaesthesia',
  'xray': 'X-ray',
  'x ray': 'X-ray',
  'checkup': 'check-up',
  'plack': 'plaque',
  'tarter': 'tartar',
  'novacaine': 'novocaine',
  'route canal': 'root canal',
  'wisdon teeth': 'wisdom teeth'
}

export function getAISuggestions(content: string, currentPosition?: number): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  const lines = content.split('\n')
  const currentLine = currentPosition ? content.substring(0, currentPosition).split('\n').length - 1 : -1
  
  // Context-aware component suggestions
  const componentSuggestions = getComponentSuggestions(content, currentLine)
  suggestions.push(...componentSuggestions)
  
  // Grammar and spelling corrections
  const corrections = getSpellingCorrections(content)
  suggestions.push(...corrections)
  
  // Content enhancements
  const enhancements = getContentEnhancements(content)
  suggestions.push(...enhancements)
  
  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

function getComponentSuggestions(content: string, currentLine: number): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  const contentLower = content.toLowerCase()
  
  // Check for cost/price mentions
  if (contentLower.includes('cost') || contentLower.includes('price') || contentLower.includes('£')) {
    if (!contentLower.includes('<costtable') && !contentLower.includes('<enhancedcosttable')) {
      suggestions.push({
        type: 'component',
        title: 'Add Cost Table',
        description: 'You mentioned costs - consider adding a cost table',
        suggestion: `<EnhancedCostTable 
  title="Treatment Costs"
  items={[
    { item: "Consultation", cost: "£50-80", nhs: true },
    { item: "Treatment", cost: "£200-400", nhs: false }
  ]}
  showCalculator={true}
/>`,
        confidence: 0.8,
        context: 'cost'
      })
    }
  }
  
  // Check for timeline/steps mentions
  if (contentLower.includes('step') || contentLower.includes('procedure') || contentLower.includes('timeline')) {
    if (!contentLower.includes('<timeline') && !contentLower.includes('<branchingtimeline')) {
      suggestions.push({
        type: 'component',
        title: 'Add Timeline',
        description: 'Consider using a timeline to show procedure steps',
        suggestion: `<BranchingTimeline 
  stages={[
    {
      title: "Step 1: Initial Assessment",
      description: "Evaluate the condition",
      options: ["Option A", "Option B"]
    },
    {
      title: "Step 2: Treatment",
      description: "Perform the procedure"
    },
    {
      title: "Step 3: Follow-up",
      description: "Monitor recovery"
    }
  ]}
/>`,
        confidence: 0.7,
        context: 'timeline'
      })
    }
  }
  
  // Check for FAQ patterns
  const questionPattern = /\?[\s\n]*$/gm
  const questionCount = (content.match(questionPattern) || []).length
  if (questionCount >= 3 && !contentLower.includes('<faq') && !contentLower.includes('<smartfaq')) {
    suggestions.push({
      type: 'component',
      title: 'Convert to FAQ',
      description: 'Multiple questions detected - consider using SmartFAQ component',
      suggestion: `<SmartFAQ 
  faqs={[
    {
      question: "Your first question here?",
      answer: "The answer to the first question...",
      category: "general"
    },
    {
      question: "Your second question here?",
      answer: "The answer to the second question...",
      category: "general"
    },
    {
      question: "Your third question here?",
      answer: "The answer to the third question...",
      category: "general"
    }
  ]}
/>`,
      confidence: 0.85,
      context: 'faq'
    })
  }
  
  // Check for medication mentions
  if (contentLower.includes('medication') || contentLower.includes('prescription') || 
      contentLower.includes('dosage') || contentLower.includes('antibiotic')) {
    if (!contentLower.includes('<medicationcard')) {
      suggestions.push({
        type: 'component',
        title: 'Add Medication Card',
        description: 'Medication mentioned - use MedicationCard for clear presentation',
        suggestion: `<MedicationCard 
  name="Medication Name"
  dosage="500mg"
  frequency="Twice daily"
  duration="5-7 days"
  instructions="Take with food. Complete the full course."
/>`,
        confidence: 0.75,
        context: 'medication'
      })
    }
  }
  
  // Check for warning/emergency keywords
  if (contentLower.includes('emergency') || contentLower.includes('urgent') || 
      contentLower.includes('immediately') || contentLower.includes('danger')) {
    if (!contentLower.includes('type="emergency"')) {
      suggestions.push({
        type: 'component',
        title: 'Use Emergency Alert',
        description: 'Emergency situation mentioned - use emergency alert type',
        suggestion: '<Alert type="emergency">',
        confidence: 0.9,
        context: 'emergency'
      })
    }
  }
  
  return suggestions
}

function getSpellingCorrections(content: string): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  const words = content.split(/\s+/)
  
  words.forEach((word, index) => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:]$/, '')
    
    // Check common misspellings
    if (commonMisspellings[cleanWord]) {
      suggestions.push({
        type: 'correction',
        title: 'Spelling Correction',
        description: `"${cleanWord}" should be "${commonMisspellings[cleanWord]}"`,
        suggestion: commonMisspellings[cleanWord],
        confidence: 0.95
      })
    }
    
    // Check for missing hyphens in compound dental terms
    if (cleanWord === 'root' && words[index + 1]?.toLowerCase() === 'canal') {
      suggestions.push({
        type: 'correction',
        title: 'Compound Term',
        description: 'Consider hyphenating "root canal" in certain contexts',
        suggestion: 'root canal treatment',
        confidence: 0.6
      })
    }
  })
  
  return suggestions
}

function getContentEnhancements(content: string): AISuggestion[] {
  const suggestions: AISuggestion[] = []
  const lines = content.split('\n')
  
  // Check for missing headings
  if (content.length > 500 && !content.includes('#')) {
    suggestions.push({
      type: 'enhancement',
      title: 'Add Headings',
      description: 'Long content without headings - consider adding structure',
      suggestion: '## Section Heading',
      confidence: 0.7
    })
  }
  
  // Check for very long paragraphs
  const paragraphs = content.split('\n\n')
  paragraphs.forEach(para => {
    if (para.length > 400 && !para.includes('\n')) {
      suggestions.push({
        type: 'enhancement',
        title: 'Break Up Paragraph',
        description: 'Very long paragraph detected - consider breaking it up',
        suggestion: 'Split into multiple paragraphs or add bullet points',
        confidence: 0.65
      })
    }
  })
  
  // Check for disclaimer needs
  const needsDisclaimer = contentLower => 
    (contentLower.includes('treatment') || contentLower.includes('procedure')) &&
    !contentLower.includes('disclaimer') &&
    !contentLower.includes('consult your dentist')
  
  if (needsDisclaimer(content.toLowerCase())) {
    suggestions.push({
      type: 'enhancement',
      title: 'Add Medical Disclaimer',
      description: 'Medical advice given - consider adding a disclaimer',
      suggestion: '> **Disclaimer:** Always consult with a qualified dentist for proper diagnosis and treatment.',
      confidence: 0.8
    })
  }
  
  // Check for missing alt text on images
  const imagePattern = /!\[([^\]]*)\]/g
  const images = content.match(imagePattern) || []
  images.forEach(img => {
    if (img === '![]') {
      suggestions.push({
        type: 'enhancement',
        title: 'Add Image Alt Text',
        description: 'Image missing alt text for accessibility',
        suggestion: '![Descriptive alt text]',
        confidence: 0.9
      })
    }
  })
  
  return suggestions
}

export async function getAISuggestionsFromAPI(
  content: string,
  apiEndpoint: string,
  apiKey: string
): Promise<AISuggestion[]> {
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-mini',
        messages: [
          {
            role: 'system',
            content: `You are a dental content editor AI. Analyze the content and provide suggestions for:
              1. Which MDX components would enhance the content
              2. Grammar and medical terminology corrections
              3. Content structure improvements
              4. Missing important information
              
              Return suggestions in this JSON format:
              {
                "suggestions": [
                  {
                    "type": "component|content|correction|enhancement",
                    "title": "Brief title",
                    "description": "Why this suggestion",
                    "suggestion": "The actual suggestion or code",
                    "confidence": 0.0-1.0
                  }
                ]
              }`
          },
          {
            role: 'user',
            content: `Analyze this dental article content:\n\n${content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    })
    
    if (!response.ok) {
      throw new Error('API request failed')
    }
    
    const data = await response.json()
    const aiResponse = JSON.parse(data.choices[0].message.content)
    
    return aiResponse.suggestions || []
  } catch (error) {
    console.error('AI suggestions error:', error)
    // Fall back to local suggestions
    return getAISuggestions(content)
  }
}

// Real-time suggestion provider for editor
export class MDXSuggestionProvider {
  private debounceTimer: NodeJS.Timeout | null = null
  private lastContent: string = ''
  private lastSuggestions: AISuggestion[] = []
  
  constructor(
    private onSuggestionsUpdate: (suggestions: AISuggestion[]) => void,
    private apiEndpoint?: string,
    private apiKey?: string
  ) {}
  
  updateContent(content: string, cursorPosition?: number) {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    
    // Don't re-process if content hasn't changed significantly
    if (Math.abs(content.length - this.lastContent.length) < 5) {
      return
    }
    
    // Debounce to avoid too many calculations
    this.debounceTimer = setTimeout(async () => {
      this.lastContent = content
      
      let suggestions: AISuggestion[]
      if (this.apiEndpoint && this.apiKey) {
        suggestions = await getAISuggestionsFromAPI(content, this.apiEndpoint, this.apiKey)
      } else {
        suggestions = getAISuggestions(content, cursorPosition)
      }
      
      this.lastSuggestions = suggestions
      this.onSuggestionsUpdate(suggestions)
    }, 1000) // Wait 1 second after typing stops
  }
  
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  }
}