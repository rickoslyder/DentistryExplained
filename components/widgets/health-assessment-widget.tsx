"use client"

import { useState } from "react"
import { CheckCircle, AlertTriangle, Info, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface Question {
  id: string
  question: string
  options: { value: string; label: string; score: number }[]
}

export function HealthAssessmentWidget() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showResults, setShowResults] = useState(false)

  const questions: Question[] = [
    {
      id: "brushing",
      question: "How often do you brush your teeth?",
      options: [
        { value: "twice-daily", label: "Twice daily or more", score: 3 },
        { value: "once-daily", label: "Once daily", score: 2 },
        { value: "few-times-week", label: "A few times a week", score: 1 },
        { value: "rarely", label: "Rarely", score: 0 },
      ],
    },
    {
      id: "flossing",
      question: "How often do you floss?",
      options: [
        { value: "daily", label: "Daily", score: 3 },
        { value: "few-times-week", label: "A few times a week", score: 2 },
        { value: "occasionally", label: "Occasionally", score: 1 },
        { value: "never", label: "Never", score: 0 },
      ],
    },
    {
      id: "dental-visits",
      question: "When did you last visit a dentist?",
      options: [
        { value: "6-months", label: "Within the last 6 months", score: 3 },
        { value: "1-year", label: "Within the last year", score: 2 },
        { value: "2-years", label: "1-2 years ago", score: 1 },
        { value: "longer", label: "More than 2 years ago", score: 0 },
      ],
    },
    {
      id: "symptoms",
      question: "Do you experience any dental symptoms?",
      options: [
        { value: "none", label: "No symptoms", score: 3 },
        { value: "sensitivity", label: "Tooth sensitivity", score: 1 },
        { value: "bleeding-gums", label: "Bleeding gums", score: 0 },
        { value: "pain", label: "Tooth pain", score: 0 },
      ],
    },
  ]

  const calculateScore = () => {
    let totalScore = 0
    questions.forEach((question) => {
      const answer = answers[question.id]
      if (answer) {
        const option = question.options.find((opt) => opt.value === answer)
        if (option) totalScore += option.score
      }
    })
    return totalScore
  }

  const getScoreCategory = (score: number) => {
    if (score >= 10) return { level: "excellent", color: "text-green-600", bg: "bg-green-50" }
    if (score >= 7) return { level: "good", color: "text-blue-600", bg: "bg-blue-50" }
    if (score >= 4) return { level: "fair", color: "text-yellow-600", bg: "bg-yellow-50" }
    return { level: "needs-improvement", color: "text-red-600", bg: "bg-red-50" }
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResults(true)
    }
  }

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [questions[currentQuestion].id]: value }))
  }

  const resetAssessment = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setShowResults(false)
  }

  if (showResults) {
    const score = calculateScore()
    const category = getScoreCategory(score)

    return (
      <Card className={`${category.bg} border-2`}>
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
            {category.level === "excellent" ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : category.level === "needs-improvement" ? (
              <AlertTriangle className="w-8 h-8 text-red-600" />
            ) : (
              <Info className="w-8 h-8 text-blue-600" />
            )}
          </div>
          <CardTitle className={`text-2xl ${category.color}`}>Your Oral Health Score: {score}/12</CardTitle>
          <Badge variant="secondary" className={`${category.color} ${category.bg} border-0`}>
            {category.level.charAt(0).toUpperCase() + category.level.slice(1).replace("-", " ")}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {category.level === "excellent" && (
              <p className="text-green-700">
                Excellent! You're maintaining great oral health habits. Keep up the good work!
              </p>
            )}
            {category.level === "good" && (
              <p className="text-blue-700">
                Good oral health habits! Consider small improvements like daily flossing for even better results.
              </p>
            )}
            {category.level === "fair" && (
              <p className="text-yellow-700">
                Your oral health could benefit from some improvements. Consider establishing a more consistent routine.
              </p>
            )}
            {category.level === "needs-improvement" && (
              <p className="text-red-700">
                Your oral health needs attention. We recommend seeing a dentist soon and improving your daily routine.
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={resetAssessment} variant="outline" className="flex-1 bg-white">
              Take Again
            </Button>
            <Button className="flex-1">
              Get Personalized Tips
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Quick Oral Health Assessment</CardTitle>
          <Badge variant="outline">
            {currentQuestion + 1} of {questions.length}
          </Badge>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{questions[currentQuestion].question}</h3>
          <RadioGroup
            value={answers[questions[currentQuestion].id] || ""}
            onValueChange={handleAnswer}
            className="space-y-3"
          >
            {questions[currentQuestion].options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <Button onClick={handleNext} disabled={!answers[questions[currentQuestion].id]} className="w-full">
          {currentQuestion === questions.length - 1 ? "Get Results" : "Next Question"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )
}
