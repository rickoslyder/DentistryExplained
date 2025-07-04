"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, ChevronRight, RotateCcw, Phone, MapPin } from 'lucide-react'
import Link from 'next/link'

interface SymptomQuestion {
  id: string
  question: string
  options: Array<{
    value: string
    label: string
    nextQuestion?: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
  }>
}

const symptomQuestions: Record<string, SymptomQuestion> = {
  start: {
    id: 'start',
    question: 'What is your main dental concern?',
    options: [
      { value: 'pain', label: 'Pain or discomfort', nextQuestion: 'painType' },
      { value: 'swelling', label: 'Swelling', nextQuestion: 'swellingLocation' },
      { value: 'bleeding', label: 'Bleeding', nextQuestion: 'bleedingType' },
      { value: 'injury', label: 'Injury or trauma', nextQuestion: 'injuryType' },
      { value: 'lost', label: 'Lost filling or crown', severity: 'medium' },
      { value: 'other', label: 'Other concern', severity: 'low' },
    ],
  },
  painType: {
    id: 'painType',
    question: 'How would you describe the pain?',
    options: [
      { value: 'sharp', label: 'Sharp, stabbing pain', nextQuestion: 'painDuration' },
      { value: 'throbbing', label: 'Throbbing, pulsating pain', nextQuestion: 'painSeverity' },
      { value: 'constant', label: 'Constant, dull ache', nextQuestion: 'painDuration' },
      { value: 'sensitivity', label: 'Sensitivity to hot/cold', severity: 'medium' },
    ],
  },
  painSeverity: {
    id: 'painSeverity',
    question: 'Is the pain accompanied by any of these symptoms?',
    options: [
      { value: 'swelling-fever', label: 'Facial swelling and fever', severity: 'critical' },
      { value: 'swelling', label: 'Facial swelling only', severity: 'high' },
      { value: 'fever', label: 'Fever only', severity: 'high' },
      { value: 'none', label: 'None of these', severity: 'medium' },
    ],
  },
  painDuration: {
    id: 'painDuration',
    question: 'How long have you had this pain?',
    options: [
      { value: 'hours', label: 'Less than 24 hours', severity: 'medium' },
      { value: 'days', label: '1-3 days', severity: 'high' },
      { value: 'week', label: 'More than 3 days', severity: 'high' },
      { value: 'intermittent', label: 'Comes and goes', severity: 'low' },
    ],
  },
  swellingLocation: {
    id: 'swellingLocation',
    question: 'Where is the swelling located?',
    options: [
      { value: 'face-neck', label: 'Face, jaw, or neck', nextQuestion: 'swellingSeverity' },
      { value: 'gums', label: 'Gums only', severity: 'medium' },
      { value: 'mouth', label: 'Inside mouth/cheek', severity: 'medium' },
    ],
  },
  swellingSeverity: {
    id: 'swellingSeverity',
    question: 'Are you experiencing any of these symptoms with the swelling?',
    options: [
      { value: 'breathing', label: 'Difficulty breathing or swallowing', severity: 'critical' },
      { value: 'eye', label: 'Swelling affecting eye or vision', severity: 'critical' },
      { value: 'fever', label: 'High fever (over 38°C)', severity: 'critical' },
      { value: 'none', label: 'None of these', severity: 'high' },
    ],
  },
  bleedingType: {
    id: 'bleedingType',
    question: 'What type of bleeding are you experiencing?',
    options: [
      { value: 'trauma', label: 'Heavy bleeding from injury', severity: 'critical' },
      { value: 'extraction', label: 'Bleeding after tooth extraction', nextQuestion: 'bleedingDuration' },
      { value: 'gums', label: 'Bleeding gums when brushing', severity: 'low' },
      { value: 'spontaneous', label: 'Spontaneous bleeding', severity: 'high' },
    ],
  },
  bleedingDuration: {
    id: 'bleedingDuration',
    question: 'How long has the bleeding continued?',
    options: [
      { value: 'minutes', label: 'Less than 30 minutes', severity: 'medium' },
      { value: 'hours', label: '30 minutes to 2 hours', severity: 'high' },
      { value: 'persistent', label: 'More than 2 hours', severity: 'critical' },
    ],
  },
  injuryType: {
    id: 'injuryType',
    question: 'What type of dental injury occurred?',
    options: [
      { value: 'knocked-out', label: 'Tooth knocked out completely', severity: 'critical' },
      { value: 'loose', label: 'Tooth loose or displaced', severity: 'high' },
      { value: 'broken', label: 'Tooth broken or chipped', severity: 'high' },
      { value: 'soft-tissue', label: 'Cut to lips, tongue, or gums', severity: 'medium' },
    ],
  },
}

const severityRecommendations = {
  critical: {
    title: 'Seek Emergency Care Immediately',
    description: 'Your symptoms indicate a serious dental emergency that requires immediate attention.',
    actions: [
      { label: 'Call 999', icon: Phone, href: 'tel:999', urgent: true },
      { label: 'Find nearest A&E', icon: MapPin, href: 'https://www.nhs.uk/service-search/accident-and-emergency-services/locationsearch/428' },
    ],
    color: 'bg-red-50 border-red-200',
    iconColor: 'text-red-600',
  },
  high: {
    title: 'Urgent Dental Care Needed',
    description: 'You should seek dental care as soon as possible, ideally within the next few hours.',
    actions: [
      { label: 'Call NHS 111', icon: Phone, href: 'tel:111' },
      { label: 'Find Emergency Dentist', icon: MapPin, href: '/find-dentist?emergency=true' },
    ],
    color: 'bg-orange-50 border-orange-200',
    iconColor: 'text-orange-600',
  },
  medium: {
    title: 'Dental Care Recommended Soon',
    description: 'You should see a dentist within the next 24-48 hours to prevent complications.',
    actions: [
      { label: 'Book Appointment', icon: Phone, href: '/find-dentist' },
      { label: 'NHS 111 Online', icon: ChevronRight, href: 'https://111.nhs.uk' },
    ],
    color: 'bg-yellow-50 border-yellow-200',
    iconColor: 'text-yellow-600',
  },
  low: {
    title: 'Routine Dental Care Advised',
    description: 'Your symptoms suggest a non-urgent issue. Schedule a regular dental appointment.',
    actions: [
      { label: 'Find a Dentist', icon: MapPin, href: '/find-dentist' },
      { label: 'Learn More', icon: ChevronRight, href: '/knowledge-base' },
    ],
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
  },
}

export function SymptomChecker() {
  const [currentQuestion, setCurrentQuestion] = useState('start')
  const [selectedValue, setSelectedValue] = useState('')
  const [severity, setSeverity] = useState<keyof typeof severityRecommendations | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const question = symptomQuestions[currentQuestion]
  const recommendation = severity ? severityRecommendations[severity] : null

  const handleNext = () => {
    if (!selectedValue) return

    const selectedOption = question.options.find(opt => opt.value === selectedValue)
    if (!selectedOption) return

    // Store answer
    setAnswers(prev => ({ ...prev, [currentQuestion]: selectedValue }))

    // Check if we have a severity result
    if (selectedOption.severity) {
      setSeverity(selectedOption.severity)
    } else if (selectedOption.nextQuestion) {
      setCurrentQuestion(selectedOption.nextQuestion)
      setSelectedValue('')
    }
  }

  const handleReset = () => {
    setCurrentQuestion('start')
    setSelectedValue('')
    setSeverity(null)
    setAnswers({})
  }

  if (recommendation) {
    return (
      <Card className={`${recommendation.color}`}>
        <CardHeader>
          <div className="flex items-start space-x-3">
            <AlertCircle className={`h-6 w-6 ${recommendation.iconColor} mt-0.5`} />
            <div className="flex-1">
              <CardTitle>{recommendation.title}</CardTitle>
              <CardDescription className="mt-1">
                {recommendation.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendation.actions.map((action, index) => (
              <Button
                key={index}
                className={`w-full justify-start ${action.urgent ? '' : 'variant-outline'}`}
                variant={action.urgent ? 'default' : 'outline'}
                asChild
              >
                <a 
                  href={action.href} 
                  target={action.href.startsWith('http') ? '_blank' : undefined}
                  rel={action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </a>
              </Button>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Symptom Checker</CardTitle>
        <CardDescription>
          Answer a few questions to help determine the urgency of your dental concern
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-lg mb-4">{question.question}</h3>
            <RadioGroup value={selectedValue} onValueChange={setSelectedValue}>
              <div className="space-y-3">
                {question.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label 
                      htmlFor={option.value} 
                      className="flex-1 cursor-pointer py-2"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-3">
            {currentQuestion !== 'start' && (
              <Button
                variant="outline"
                onClick={() => {
                  const previousQuestions = Object.keys(answers)
                  if (previousQuestions.length > 0) {
                    const lastQuestion = previousQuestions[previousQuestions.length - 1]
                    setCurrentQuestion(lastQuestion)
                    setSelectedValue(answers[lastQuestion])
                    const newAnswers = { ...answers }
                    delete newAnswers[lastQuestion]
                    setAnswers(newAnswers)
                  }
                }}
              >
                Back
              </Button>
            )}
            
            <Button 
              onClick={handleNext}
              disabled={!selectedValue}
              className="flex-1"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            This tool provides general guidance only. Always seek professional dental care for proper diagnosis and treatment.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}