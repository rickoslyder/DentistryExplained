"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle, Loader2 } from "lucide-react"

interface FollowUpQuestionsProps {
  topic: string
  category?: string
  onQuestionClick: (question: string) => void
  enabled?: boolean
  sessionId?: string
}

// Expanded pool of follow-up questions for better variety
const questionPools: Record<string, string[]> = {
  filling_cavity: [
    "How long do fillings typically last?",
    "What's the difference between white and silver fillings?",
    "How can I prevent more cavities?",
    "What happens if I don't get a cavity filled?",
    "Can I eat normally after getting a filling?",
    "Why do some fillings hurt after placement?",
    "How much does a filling cost on the NHS?",
    "Can fillings fall out?",
    "Are white fillings as strong as silver ones?",
    "Do I need to replace old fillings?",
    "Can cavities form under fillings?",
    "What are the signs a filling needs replacing?"
  ],
  toothache: [
    "When is toothache an emergency?",
    "What painkillers are safe for dental pain?",
    "Could this be an abscess?",
    "Why does my tooth hurt when I bite down?",
    "Can a toothache go away on its own?",
    "Why is my toothache worse at night?",
    "Should I use hot or cold compress for tooth pain?",
    "What causes sudden sharp tooth pain?",
    "Can stress cause toothache?",
    "Is it safe to fly with a toothache?",
    "When should I go to A&E for tooth pain?",
    "Can toothache cause headaches?"
  ],
  gum_disease: [
    "What's the difference between gingivitis and periodontitis?",
    "Can gum disease be reversed?",
    "Which mouthwash is best for gum problems?",
    "Why do my gums bleed when I brush?",
    "How long does it take to cure gingivitis?",
    "Can gum disease cause tooth loss?",
    "Is gum disease linked to heart problems?",
    "What foods help heal gums?",
    "Should I still brush if my gums are bleeding?",
    "Can pregnancy cause gum problems?",
    "How often should I see a hygienist?",
    "Are electric toothbrushes better for gum disease?"
  ],
  whitening: [
    "Is teeth whitening safe?",
    "How long do whitening results last?",
    "What about whitening toothpaste?",
    "Can I whiten my teeth if I have fillings?",
    "Why are my teeth yellow despite good hygiene?",
    "What's the best home whitening method?",
    "Can whitening damage enamel?",
    "How white is too white for teeth?",
    "Does oil pulling really whiten teeth?",
    "Can I whiten teeth while pregnant?",
    "Why do teeth get darker with age?",
    "How soon after whitening can I drink coffee?"
  ],
  children: [
    "When should my child first see a dentist?",
    "How much toothpaste should children use?",
    "What about fluoride for children?",
    "When do baby teeth fall out?",
    "How can I stop thumb sucking?",
    "What if my child swallows toothpaste?",
    "When should I start flossing my child's teeth?",
    "Are dental sealants worth it?",
    "How do I handle dental emergencies in children?",
    "What causes tooth decay in babies?",
    "Should I worry about teeth grinding in children?",
    "When do wisdom teeth come in?"
  ],
  cost_nhs: [
    "Am I eligible for free NHS dental treatment?",
    "What's included in each NHS band?",
    "How do payment plans work?",
    "Can I get help with dental costs?",
    "How are NHS dental charges calculated?",
    "What if I can't afford emergency dental care?",
    "Is private dental insurance worth it?",
    "Can I mix NHS and private treatment?",
    "How much notice for cancelling NHS appointments?",
    "Do students get free dental treatment?",
    "What's covered for pregnant women?",
    "Can I claim back dental costs?"
  ],
  dental_anxiety: [
    "What if I'm nervous about the dentist?",
    "What sedation options are available?",
    "How do I find a dentist for nervous patients?",
    "Can I bring someone with me to appointments?",
    "What causes dental phobia?",
    "Are there alternatives to injections?",
    "How can I prepare for a dental visit?",
    "What is IV sedation like?",
    "Can hypnotherapy help with dental fear?",
    "Should I tell my dentist I'm anxious?",
    "What if I have a panic attack during treatment?",
    "Are there numbing gels before injections?"
  ],
  oral_hygiene: [
    "Electric vs manual toothbrush - which is better?",
    "Should I use mouthwash?",
    "How do I floss properly?",
    "When should I brush - before or after breakfast?",
    "How often should I change my toothbrush?",
    "Is water flossing as good as string floss?",
    "What order: brush, floss, or mouthwash?",
    "Can I brush too much?",
    "What's the best toothpaste for sensitive teeth?",
    "Should I use a tongue scraper?",
    "How long should I wait after eating to brush?",
    "Are bamboo toothbrushes effective?"
  ],
  root_canal: [
    "Is root canal treatment painful?",
    "How long does a root canal take?",
    "What's the success rate of root canals?",
    "Can I avoid a root canal?",
    "Why do I need a crown after root canal?",
    "What happens if I don't get a root canal?",
    "Can a root canal fail?",
    "How much does root canal cost?",
    "Is extraction better than root canal?",
    "Can I eat after root canal treatment?",
    "Why is my tooth dark after root canal?",
    "Do all infected teeth need root canals?"
  ],
  wisdom_teeth: [
    "When should wisdom teeth be removed?",
    "What are impacted wisdom teeth?",
    "Is wisdom tooth removal painful?",
    "How long is recovery from extraction?",
    "Can I keep my wisdom teeth?",
    "What are dry sockets?",
    "Why do wisdom teeth cause problems?",
    "What foods can I eat after extraction?",
    "When can I exercise after extraction?",
    "Do all wisdom teeth need removing?",
    "What age do wisdom teeth come through?",
    "Can wisdom teeth cause headaches?"
  ],
  emergency: [
    "What counts as a dental emergency?",
    "What if I knock out a tooth?",
    "Where can I get emergency dental care?",
    "What if my face is swollen?",
    "Can I go to A&E for dental problems?",
    "What's the NHS 111 dental service?",
    "How do I handle a broken tooth?",
    "What if I can't stop bleeding after extraction?",
    "Is severe tooth pain an emergency?",
    "What about dental injuries in children?",
    "Can dental infections be dangerous?",
    "What if I break my denture?"
  ],
  pregnancy: [
    "Is dental treatment safe during pregnancy?",
    "Can pregnancy affect my teeth and gums?",
    "When should I tell my dentist I'm pregnant?",
    "Are X-rays safe when pregnant?",
    "Can I have fillings while pregnant?",
    "Why do gums bleed more in pregnancy?",
    "Is teeth whitening safe when pregnant?",
    "Can morning sickness damage teeth?",
    "Do I get free dental care when pregnant?",
    "Can dental problems affect my baby?",
    "Should I delay treatment until after birth?",
    "What about breastfeeding and dental work?"
  ]
}

// Generate contextual follow-up questions based on the topic
function generateFollowUpQuestions(topic: string, category?: string): { questions: string[], needsAI: boolean } {
  const lowerTopic = topic.toLowerCase()
  let selectedQuestions: string[] = []
  let needsAI = false

  // Check each pool for matches
  if (lowerTopic.includes('filling') || lowerTopic.includes('cavity') || lowerTopic.includes('decay')) {
    selectedQuestions = questionPools.filling_cavity
  } else if (lowerTopic.includes('tooth') && (lowerTopic.includes('ache') || lowerTopic.includes('pain') || lowerTopic.includes('hurt'))) {
    selectedQuestions = questionPools.toothache
  } else if (lowerTopic.includes('gum') || lowerTopic.includes('bleeding') || lowerTopic.includes('gingivitis') || lowerTopic.includes('periodon')) {
    selectedQuestions = questionPools.gum_disease
  } else if (lowerTopic.includes('whiten') || lowerTopic.includes('white') || lowerTopic.includes('yellow') || lowerTopic.includes('stain')) {
    selectedQuestions = questionPools.whitening
  } else if (lowerTopic.includes('child') || lowerTopic.includes('baby') || lowerTopic.includes('kid') || lowerTopic.includes('toddler')) {
    selectedQuestions = questionPools.children
  } else if (lowerTopic.includes('cost') || lowerTopic.includes('nhs') || lowerTopic.includes('price') || lowerTopic.includes('pay') || lowerTopic.includes('fee')) {
    selectedQuestions = questionPools.cost_nhs
  } else if (lowerTopic.includes('nervous') || lowerTopic.includes('anxious') || lowerTopic.includes('scared') || lowerTopic.includes('fear') || lowerTopic.includes('phobia')) {
    selectedQuestions = questionPools.dental_anxiety
  } else if (lowerTopic.includes('brush') || lowerTopic.includes('clean') || lowerTopic.includes('floss') || lowerTopic.includes('hygiene')) {
    selectedQuestions = questionPools.oral_hygiene
  } else if (lowerTopic.includes('root canal') || lowerTopic.includes('nerve')) {
    selectedQuestions = questionPools.root_canal
  } else if (lowerTopic.includes('wisdom') || lowerTopic.includes('third molar')) {
    selectedQuestions = questionPools.wisdom_teeth
  } else if (lowerTopic.includes('emergency') || lowerTopic.includes('urgent') || lowerTopic.includes('accident')) {
    selectedQuestions = questionPools.emergency
  } else if (lowerTopic.includes('pregnant') || lowerTopic.includes('pregnancy') || lowerTopic.includes('expecting')) {
    selectedQuestions = questionPools.pregnancy
  } else if (lowerTopic.includes('dentist') || lowerTopic.includes('appointment') || lowerTopic.includes('check')) {
    // Mix questions from different pools for general dentist queries
    selectedQuestions = [
      ...questionPools.dental_anxiety.slice(0, 4),
      ...questionPools.cost_nhs.slice(0, 4),
      "What happens at a dental check-up?",
      "How do I find an NHS dentist?",
      "How often should I visit the dentist?",
      "Can I change dentists?"
    ]
  } else {
    // For unmatched topics, use generic questions and flag for AI generation
    selectedQuestions = [
      "How can I prevent dental problems?",
      "When should I see a dentist about this?",
      "Are there any home remedies I can try?",
      "Is this something urgent?",
      "Could this be related to other health issues?",
      "What are the treatment options?",
      "How common is this problem?",
      "Will this get worse without treatment?",
      "Can diet affect this condition?"
    ]
    needsAI = true
  }

  // Return 3 random questions from the selected pool
  return {
    questions: selectedQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, 3),
    needsAI
  }
}

export function FollowUpQuestions({ 
  topic, 
  category, 
  onQuestionClick, 
  enabled = true,
  sessionId
}: FollowUpQuestionsProps) {
  const [questions, setQuestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (enabled && topic) {
      const fetchQuestions = async () => {
        const { questions: predefinedQuestions, needsAI } = generateFollowUpQuestions(topic, category)
        
        // If we have good predefined questions, use them
        if (!needsAI) {
          setQuestions(predefinedQuestions)
          return
        }

        // Otherwise, try to get AI-generated questions
        setIsLoading(true)
        try {
          const response = await fetch('/api/chat/suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: topic,
              context: category ? { category } : undefined
            })
          })

          if (response.ok) {
            const data = await response.json()
            setQuestions(data.questions || predefinedQuestions)
          } else {
            // Fallback to predefined questions on error
            setQuestions(predefinedQuestions)
          }
        } catch {
          // Fallback to predefined questions on error
          setQuestions(predefinedQuestions)
        } finally {
          setIsLoading(false)
        }
      }

      fetchQuestions()
    }
  }, [topic, category, enabled])

  if (!enabled || (questions.length === 0 && !isLoading)) return null

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-500 mb-2 flex items-center">
        <HelpCircle className="w-3 h-3 mr-1" />
        Related questions you might have:
      </p>
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-9 bg-gray-100 rounded animate-pulse"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : (
          questions.map((question, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => onQuestionClick(question)}
              className="text-left justify-start h-auto py-2 px-3 text-sm font-normal hover:bg-gray-50 w-full whitespace-normal text-wrap break-words transition-all duration-200 hover:translate-x-1"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {question}
            </Button>
          ))
        )}
      </div>
    </div>
  )
}