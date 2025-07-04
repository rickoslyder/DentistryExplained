// Types for user preferences
interface UserProfile {
  user_type: 'patient' | 'professional'
  preferences?: {
    responseStyle: 'concise' | 'detailed'
    complexityLevel: 'basic' | 'advanced'
    includeCosts: boolean
    autoSuggestFollowUp: boolean
  }
}

// Function to generate dynamic system prompt based on user profile
export function generateSystemPrompt(userProfile?: UserProfile): string {
  const defaultProfile: UserProfile = {
    user_type: 'patient',
    preferences: {
      responseStyle: 'concise',
      complexityLevel: 'basic',
      includeCosts: false,
      autoSuggestFollowUp: true
    }
  }
  
  const profile = {
    ...defaultProfile,
    ...userProfile,
    preferences: {
      ...defaultProfile.preferences,
      ...userProfile?.preferences
    }
  }
  
  const isProfessional = profile.user_type === 'professional'
  const isDetailed = profile.preferences?.responseStyle === 'detailed'
  const isAdvanced = profile.preferences?.complexityLevel === 'advanced'
  const includeCosts = profile.preferences?.includeCosts
  
  // Professional prompts
  if (isProfessional) {
    return `You are a clinical dental assistant for dental professionals on DentistryExplained.co.uk.

COMMUNICATION STYLE:
- Use appropriate dental terminology and clinical language
- Be concise and evidence-based (${isDetailed ? 'provide comprehensive clinical detail' : 'keep responses brief and focused'})
- Reference current UK guidelines (NICE, SDCEP, FGDP)
- Include relevant clinical considerations and contraindications

IMPORTANT:
- Focus on best practices and clinical relevance
- Reference specific materials, techniques, and protocols
- Assume clinical knowledge but clarify complex procedures
- Cite evidence where applicable`
  }
  
  // Patient prompts based on preferences
  const complexityGuide = isAdvanced 
    ? 'Use clear language but include medical terms with explanations. Provide more detailed information about mechanisms and processes.'
    : 'Use simple, everyday language (6th grade reading level). Avoid medical jargon unless absolutely necessary.'
  
  const lengthGuide = isDetailed
    ? 'Provide comprehensive answers with relevant context, examples, and additional helpful information.'
    : 'Keep responses SHORT and focused - maximum 2-3 sentences for simple questions. Only elaborate if specifically asked.'
  
  const costGuide = includeCosts
    ? 'Include relevant NHS charges when discussing treatments (2025 rates: Band 1: £27.40, Band 2: £75.30, Band 3: £326.70).'
    : 'Only mention costs if specifically asked about prices or fees.'
  
  return `You are a friendly dental health assistant for patients on DentistryExplained.co.uk.

COMMUNICATION STYLE:
- ${complexityGuide}
- ${lengthGuide}
- ${costGuide}
- Be warm, empathetic, and reassuring

RESPONSE GUIDELINES:
- Answer the specific question asked - don't add unnecessary information
- For basic questions, stick to the essentials
- Always encourage consulting a dentist for personal concerns
- Never diagnose or prescribe treatments

IMPORTANT: Prioritize being helpful over being comprehensive. Most users want quick, clear answers.`
}

// Dental Knowledge Base for AI Assistant
export const dentalKnowledgeBase = {
  // Default system prompt (legacy support)
  systemPrompt: generateSystemPrompt(),

  contextualPrompts: {
    emergency: `The user may be experiencing a dental emergency. Provide calm, clear first aid advice while strongly encouraging them to seek immediate professional help. Reference the emergency resources available on the site.`,
    
    treatment: `The user is asking about dental treatments. Explain the procedure clearly, including what to expect, typical duration, and aftercare. Mention both NHS and private options where relevant.`,
    
    prevention: `Focus on preventive care advice. Emphasize the importance of regular brushing, flossing, and dental check-ups. Provide practical tips they can implement immediately.`,
    
    children: `The user is asking about children's dental health. Use simple, parent-friendly language. Reference the 2025 supervised toothbrushing programme and age-appropriate fluoride guidelines.`,
    
    costs: `The user is asking about dental costs. Provide current 2025 NHS charges and explain the banding system. Mention that private costs vary and suggest contacting practices directly.`,
  } as Record<string, string>,

  commonTopics: {
    toothache: {
      keywords: ['pain', 'hurt', 'ache', 'throb', 'sensitive'],
      response: `Toothache can have various causes including cavities, infections, or sensitivity. For immediate relief:
- Rinse with warm salt water
- Take over-the-counter pain relief (following package instructions)
- Apply a cold compress to the outside of your cheek
- Avoid very hot or cold foods

However, persistent pain needs professional evaluation. Book an emergency appointment with your dentist or call NHS 111 for urgent advice.`,
    },
    
    gumDisease: {
      keywords: ['gum', 'bleeding', 'gingivitis', 'periodontal', 'swollen gums'],
      response: `Gum disease starts with gingivitis (inflamed gums) and can progress to periodontitis. Signs include:
- Red, swollen, or bleeding gums
- Bad breath
- Receding gums
- Loose teeth (advanced stages)

Prevention involves good oral hygiene: brush twice daily with fluoride toothpaste, floss daily, and see your dentist regularly. Early gum disease is reversible with proper care.`,
    },
    
    dentalAnxiety: {
      keywords: ['scared', 'nervous', 'anxious', 'fear', 'phobia'],
      response: `Dental anxiety is very common. Modern dentistry offers many ways to help:
- Tell your dentist about your fears
- Ask about sedation options
- Use relaxation techniques
- Consider CBT therapy for severe phobia
- Start with a simple check-up to build confidence

Many practices specialize in anxious patients. You're not alone, and help is available.`,
    },
    
    nhsCharges: {
      keywords: ['cost', 'price', 'charge', 'fee', 'NHS', 'payment'],
      response: `NHS dental charges from April 2025:
- Band 1 (£27.40): Examination, diagnosis, preventive advice, X-rays, scale and polish
- Band 2 (£75.30): Everything in Band 1 plus fillings, root canals, extractions
- Band 3 (£326.70): Everything in Bands 1 & 2 plus crowns, dentures, bridges

Free for: under 18s, pregnant women, new mothers (up to 12 months), certain benefits recipients. Always check your eligibility for free treatment.`,
    },
  } as Record<string, { keywords: string[]; response: string }>,

  emergencyGuidance: {
    severeConditions: [
      'facial swelling',
      'difficulty swallowing',
      'difficulty breathing',
      'uncontrolled bleeding',
      'severe trauma',
    ],
    
    urgentResponse: `This sounds like a serious emergency. You need immediate medical attention:
- For difficulty breathing/swallowing or severe facial swelling: Call 999 or go to A&E immediately
- For severe dental pain or trauma: Call NHS 111 for urgent guidance
- For uncontrolled bleeding: Apply firm pressure with gauze and seek immediate help`,
  },

  preventionTips: [
    'Brush twice daily for 2 minutes with fluoride toothpaste',
    'Spit don\'t rinse after brushing to keep fluoride on teeth',
    'Clean between teeth daily with floss or interdental brushes',
    'Limit sugary foods and drinks to mealtimes',
    'Visit your dentist regularly (usually every 6-12 months)',
    'Change your toothbrush every 3 months',
    'Wait 1 hour after eating before brushing',
  ],

  ageSpecificGuidance: {
    babies: 'Start brushing as soon as first tooth appears. Use a smear of 1,000ppm fluoride toothpaste.',
    toddlers: 'Brush twice daily with a smear of toothpaste. Supervise until age 7-8.',
    children: 'Use pea-sized amount of toothpaste. Consider fissure sealants on permanent molars.',
    teenagers: 'Watch for wisdom teeth issues. Maintain good habits despite busy schedules.',
    adults: 'Regular check-ups crucial. Consider treatments for wear, previous fillings.',
    elderly: 'Dry mouth common with medications. Electric toothbrushes helpful for dexterity issues.',
  },
}

// Helper function to detect emergency keywords
export function detectEmergency(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return dentalKnowledgeBase.emergencyGuidance.severeConditions.some(
    condition => lowerMessage.includes(condition)
  )
}

// Helper function to categorize user query
export function categorizeQuery(message: string): string | null {
  const lowerMessage = message.toLowerCase()
  
  for (const [topic, data] of Object.entries(dentalKnowledgeBase.commonTopics)) {
    if (data.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return topic
    }
  }
  
  return null
}