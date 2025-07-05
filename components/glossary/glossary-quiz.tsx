'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { 
  Brain, Trophy, Target, Clock, CheckCircle, XCircle, 
  RotateCcw, ChevronRight, Sparkles, TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { trackGlossaryInteraction } from '@/lib/glossary-tracking'

interface GlossaryTerm {
  id: string
  term: string
  definition: string
  category?: string
  difficulty?: 'basic' | 'advanced'
}

interface QuizQuestion {
  term: GlossaryTerm
  options: string[]
  correctAnswer: string
}

interface QuizResult {
  termId: string
  term: string
  correct: boolean
  responseTime: number
}

interface GlossaryQuizProps {
  terms: GlossaryTerm[]
  onClose?: () => void
}

export function GlossaryQuiz({ terms, onClose }: GlossaryQuizProps) {
  const [difficulty, setDifficulty] = useState<'all' | 'basic' | 'advanced'>('all')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [results, setResults] = useState<QuizResult[]>([])
  const [startTime, setStartTime] = useState<number>(0)
  const [quizComplete, setQuizComplete] = useState(false)

  const QUESTIONS_PER_QUIZ = 10

  // Generate quiz questions
  useEffect(() => {
    generateQuestions()
  }, [difficulty])

  const generateQuestions = () => {
    // Filter terms by difficulty
    const filteredTerms = difficulty === 'all' 
      ? terms 
      : terms.filter(t => t.difficulty === difficulty)
    
    // Shuffle and select terms
    const shuffled = [...filteredTerms].sort(() => Math.random() - 0.5)
    const selectedTerms = shuffled.slice(0, Math.min(QUESTIONS_PER_QUIZ, shuffled.length))
    
    // Generate questions
    const newQuestions: QuizQuestion[] = selectedTerms.map(term => {
      // Get 3 random wrong answers
      const wrongAnswers = filteredTerms
        .filter(t => t.id !== term.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(t => t.definition)
      
      // Mix correct answer with wrong ones
      const options = [term.definition, ...wrongAnswers].sort(() => Math.random() - 0.5)
      
      return {
        term,
        options,
        correctAnswer: term.definition
      }
    })
    
    setQuestions(newQuestions)
    setCurrentQuestion(0)
    setResults([])
    setQuizComplete(false)
    setShowResult(false)
    setSelectedAnswer(null)
  }

  const handleAnswer = async () => {
    if (!selectedAnswer || showResult) return
    
    const question = questions[currentQuestion]
    const correct = selectedAnswer === question.correctAnswer
    const responseTime = Date.now() - startTime
    
    // Record result
    const result: QuizResult = {
      termId: question.term.id,
      term: question.term.term,
      correct,
      responseTime
    }
    
    setResults([...results, result])
    setShowResult(true)
    
    // Track quiz attempt
    await trackGlossaryInteraction({
      term: question.term.term,
      interaction_type: 'quiz_attempt',
      metadata: { correct, responseTime, difficulty: question.term.difficulty }
    })
    
    // Save to database
    try {
      await fetch('/api/glossary/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term_id: question.term.id,
          correct,
          response_time_ms: responseTime,
          difficulty: question.term.difficulty
        })
      })
    } catch (error) {
      console.error('Failed to save quiz result:', error)
    }
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setStartTime(Date.now())
    } else {
      setQuizComplete(true)
    }
  }

  // Start timer when question changes
  useEffect(() => {
    if (questions.length > 0 && !quizComplete) {
      setStartTime(Date.now())
    }
  }, [currentQuestion, questions.length, quizComplete])

  if (questions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Quiz...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (quizComplete) {
    const correctCount = results.filter(r => r.correct).length
    const accuracy = (correctCount / results.length) * 100
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length / 1000

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
          <CardDescription>Here's how you did</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{correctCount}/{results.length}</div>
                <p className="text-sm text-gray-600">Correct Answers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{accuracy.toFixed(0)}%</div>
                <p className="text-sm text-gray-600">Accuracy</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Average Response Time</p>
            <p className="text-xl font-semibold">{avgResponseTime.toFixed(1)} seconds</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold mb-2">Results by Term:</h3>
            {results.map((result, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <span className="font-medium">{result.term}</span>
                {result.correct ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={generateQuestions} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="outline" className="flex-1">
                Close Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span className="font-semibold">Glossary Quiz</span>
          </div>
          <Badge variant="outline">
            Question {currentQuestion + 1} of {questions.length}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            What is the definition of "{question.term.term}"?
          </h2>
          {question.term.category && (
            <Badge variant="secondary" className="mb-4">
              {question.term.category}
            </Badge>
          )}
        </div>

        <RadioGroup value={selectedAnswer || ''} onValueChange={setSelectedAnswer}>
          <div className="space-y-3">
            {question.options.map((option, idx) => {
              const isCorrect = option === question.correctAnswer
              const isSelected = option === selectedAnswer
              
              return (
                <Label
                  key={idx}
                  htmlFor={`option-${idx}`}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                    !showResult && "hover:bg-gray-50",
                    showResult && isCorrect && "bg-green-50 border-green-500",
                    showResult && isSelected && !isCorrect && "bg-red-50 border-red-500"
                  )}
                >
                  <RadioGroupItem
                    value={option}
                    id={`option-${idx}`}
                    disabled={showResult}
                  />
                  <span className="text-sm leading-relaxed">{option}</span>
                  {showResult && isCorrect && (
                    <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-red-600 ml-auto" />
                  )}
                </Label>
              )
            })}
          </div>
        </RadioGroup>

        <div className="flex gap-2">
          {!showResult ? (
            <Button 
              onClick={handleAnswer} 
              disabled={!selectedAnswer}
              className="flex-1"
            >
              Submit Answer
            </Button>
          ) : (
            <Button onClick={nextQuestion} className="flex-1">
              {currentQuestion < questions.length - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  View Results
                  <Trophy className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}