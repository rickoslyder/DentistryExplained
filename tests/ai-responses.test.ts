/**
 * AI Response Testing Scenarios
 * Test different user types and preferences to ensure appropriate responses
 */

import { generateSystemPrompt } from '@/lib/ai/dental-knowledge'

// Test scenarios for different user types and preferences
const testScenarios = [
  {
    name: 'Patient - Basic/Concise (Default)',
    userProfile: {
      user_type: 'patient' as const,
      preferences: {
        responseStyle: 'concise' as const,
        complexityLevel: 'basic' as const,
        includeCosts: false,
        autoSuggestFollowUp: true
      }
    },
    testQuestions: [
      {
        question: 'How often should I visit the dentist?',
        expectedTraits: {
          maxSentences: 3,
          readingLevel: 'basic',
          includesCosts: false,
          medicalTerms: 'minimal'
        }
      },
      {
        question: 'What causes cavities?',
        expectedTraits: {
          maxSentences: 3,
          readingLevel: 'basic',
          includesCosts: false,
          medicalTerms: 'minimal'
        }
      }
    ]
  },
  {
    name: 'Patient - Advanced/Detailed',
    userProfile: {
      user_type: 'patient' as const,
      preferences: {
        responseStyle: 'detailed' as const,
        complexityLevel: 'advanced' as const,
        includeCosts: true,
        autoSuggestFollowUp: true
      }
    },
    testQuestions: [
      {
        question: 'How often should I visit the dentist?',
        expectedTraits: {
          minSentences: 5,
          readingLevel: 'advanced',
          includesCosts: true,
          medicalTerms: 'explained'
        }
      },
      {
        question: 'What causes cavities?',
        expectedTraits: {
          minSentences: 5,
          readingLevel: 'advanced',
          includesCosts: false, // Not relevant for this question
          medicalTerms: 'explained'
        }
      }
    ]
  },
  {
    name: 'Professional - Concise',
    userProfile: {
      user_type: 'professional' as const,
      preferences: {
        responseStyle: 'concise' as const,
        complexityLevel: 'advanced' as const,
        includeCosts: false,
        autoSuggestFollowUp: false
      }
    },
    testQuestions: [
      {
        question: 'What are the current NICE guidelines for recall intervals?',
        expectedTraits: {
          maxSentences: 5,
          readingLevel: 'professional',
          includesCosts: false,
          medicalTerms: 'standard',
          includesGuidelines: true
        }
      },
      {
        question: 'Best practice for caries risk assessment?',
        expectedTraits: {
          maxSentences: 5,
          readingLevel: 'professional',
          includesCosts: false,
          medicalTerms: 'standard',
          evidenceBased: true
        }
      }
    ]
  }
]

// Manual testing checklist
export const manualTestingChecklist = {
  userSetup: [
    'Create test patient account',
    'Create test professional account (with GDC verification)',
    'Set different preference combinations for each'
  ],
  
  responseTests: [
    {
      test: 'Response Length',
      steps: [
        'Ask same question with concise vs detailed preference',
        'Verify concise is 2-3 sentences max',
        'Verify detailed provides comprehensive answer'
      ]
    },
    {
      test: 'Language Complexity',
      steps: [
        'Ask about "periodontal disease" with basic vs advanced',
        'Verify basic says "gum disease" and explains simply',
        'Verify advanced uses proper terminology'
      ]
    },
    {
      test: 'Cost Information',
      steps: [
        'Ask "How much does a filling cost?"',
        'Verify costs appear regardless of preference',
        'Ask "What is a root canal?" with costs on/off',
        'Verify costs only appear when preference is on'
      ]
    },
    {
      test: 'Quick Actions',
      steps: [
        'Get any response over 100 characters',
        'Click "Tell me more" - verify expanded response',
        'Click "Simpler please" - verify simplified language',
        'Click "Too long" - verify shortened response',
        'Click "Examples?" - verify practical examples added'
      ]
    },
    {
      test: 'Follow-up Questions',
      steps: [
        'Ask about tooth decay',
        'Verify 2-3 relevant follow-up questions appear',
        'Turn off follow-up questions in settings',
        'Ask another question - verify no follow-ups'
      ]
    },
    {
      test: 'Professional Responses',
      steps: [
        'Login as professional',
        'Ask clinical question',
        'Verify response uses professional terminology',
        'Verify guidelines/evidence mentioned where relevant'
      ]
    }
  ],
  
  edgeCases: [
    'Very short questions like "Pain?"',
    'Long complex multi-part questions',
    'Questions in categories (emergency, costs, children)',
    'Switching preferences mid-conversation',
    'Using quick actions multiple times'
  ]
}

// Example test runner (for future automation)
export async function runResponseTest(scenario: typeof testScenarios[0]) {
  console.log(`Testing: ${scenario.name}`)
  
  // Generate system prompt for this profile
  const systemPrompt = generateSystemPrompt(scenario.userProfile)
  console.log('System Prompt:', systemPrompt)
  
  // Log expected behavior
  scenario.testQuestions.forEach(test => {
    console.log(`\nQuestion: ${test.question}`)
    console.log('Expected traits:', test.expectedTraits)
  })
  
  return {
    scenario: scenario.name,
    systemPrompt,
    tests: scenario.testQuestions
  }
}

// Export for use in testing
export { testScenarios }