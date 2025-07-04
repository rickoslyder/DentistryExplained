"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

interface FollowUpQuestionsProps {
  topic: string
  category?: string
  onQuestionClick: (question: string) => void
  enabled?: boolean
}

// Generate contextual follow-up questions based on the topic
function generateFollowUpQuestions(topic: string, category?: string): string[] {
  const lowerTopic = topic.toLowerCase()
  const questions: string[] = []

  // Check for specific topics and generate relevant questions
  if (lowerTopic.includes('filling') || lowerTopic.includes('cavity')) {
    questions.push(
      "How long do fillings typically last?",
      "What's the difference between white and silver fillings?",
      "How can I prevent more cavities?"
    )
  } else if (lowerTopic.includes('tooth') && lowerTopic.includes('ache')) {
    questions.push(
      "When is toothache an emergency?",
      "What painkillers are safe for dental pain?",
      "Could this be an abscess?"
    )
  } else if (lowerTopic.includes('gum') || lowerTopic.includes('bleeding')) {
    questions.push(
      "What's the difference between gingivitis and periodontitis?",
      "Can gum disease be reversed?",
      "Which mouthwash is best for gum problems?"
    )
  } else if (lowerTopic.includes('whiten') || lowerTopic.includes('white')) {
    questions.push(
      "Is teeth whitening safe?",
      "How long do whitening results last?",
      "What about whitening toothpaste?"
    )
  } else if (lowerTopic.includes('child') || lowerTopic.includes('baby')) {
    questions.push(
      "When should my child first see a dentist?",
      "How much toothpaste should children use?",
      "What about fluoride for children?"
    )
  } else if (lowerTopic.includes('cost') || lowerTopic.includes('nhs') || lowerTopic.includes('price')) {
    questions.push(
      "Am I eligible for free NHS dental treatment?",
      "What's included in each NHS band?",
      "How do payment plans work?"
    )
  } else if (lowerTopic.includes('dentist') || lowerTopic.includes('appointment')) {
    questions.push(
      "What happens at a dental check-up?",
      "How do I find an NHS dentist?",
      "What if I'm nervous about the dentist?"
    )
  } else if (lowerTopic.includes('brush') || lowerTopic.includes('clean')) {
    questions.push(
      "Electric vs manual toothbrush - which is better?",
      "Should I use mouthwash?",
      "How do I floss properly?"
    )
  } else {
    // Generic follow-up questions
    questions.push(
      "How can I prevent dental problems?",
      "When should I see a dentist about this?",
      "Are there any home remedies I can try?"
    )
  }

  // Return max 3 questions, randomized
  return questions.sort(() => Math.random() - 0.5).slice(0, 3)
}

export function FollowUpQuestions({ 
  topic, 
  category, 
  onQuestionClick, 
  enabled = true 
}: FollowUpQuestionsProps) {
  const [questions, setQuestions] = useState<string[]>([])

  useEffect(() => {
    if (enabled && topic) {
      const generated = generateFollowUpQuestions(topic, category)
      setQuestions(generated)
    }
  }, [topic, category, enabled])

  if (!enabled || questions.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-500 mb-2 flex items-center">
        <HelpCircle className="w-3 h-3 mr-1" />
        Related questions you might have:
      </p>
      <div className="space-y-2">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            onClick={() => onQuestionClick(question)}
            className="text-left justify-start h-auto py-2 px-3 text-sm font-normal hover:bg-gray-50 w-full"
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  )
}