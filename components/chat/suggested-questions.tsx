"use client"

import { Button } from "@/components/ui/button"

interface SuggestedQuestionsProps {
  pageContext?: {
    title: string
    category: string
    content: string
  }
  onQuestionClick: (question: string) => void
}

export function SuggestedQuestions({ pageContext, onQuestionClick }: SuggestedQuestionsProps) {
  const getContextualQuestions = () => {
    if (pageContext?.category === "dental-problems") {
      return ["What causes tooth decay?", "How can I prevent cavities?", "When should I see a dentist?"]
    }

    if (pageContext?.category === "treatments") {
      return ["What should I expect during treatment?", "How long does recovery take?", "Are there any side effects?"]
    }

    return [
      "How often should I visit the dentist?",
      "What are the signs of gum disease?",
      "How do I maintain good oral hygiene?",
      "What foods are bad for my teeth?",
    ]
  }

  const questions = getContextualQuestions()

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Suggested questions:</p>
      <div className="space-y-1">
        {questions.map((question, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left h-auto p-2 text-xs"
            onClick={() => onQuestionClick(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  )
}
