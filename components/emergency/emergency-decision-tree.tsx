"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { HelpCircle, Phone, AlertTriangle, MapPin, ChevronRight } from 'lucide-react'
import { EmergencyLogger } from '@/lib/emergency-audit'

interface DecisionNode {
  id: string
  question: string
  subtext?: string
  options: {
    label: string
    nextNodeId?: string
    action?: 'call-999' | 'call-111' | 'find-ae' | 'find-dentist' | 'self-care'
    severity?: 'critical' | 'high' | 'medium' | 'low'
  }[]
}

const decisionTree: Record<string, DecisionNode> = {
  start: {
    id: 'start',
    question: "What's happening right now?",
    subtext: "Select the option that best describes your situation",
    options: [
      { label: "Difficulty breathing or swallowing", action: 'call-999', severity: 'critical' },
      { label: "Severe facial swelling", nextNodeId: 'swelling' },
      { label: "Uncontrolled bleeding", nextNodeId: 'bleeding' },
      { label: "Severe pain", nextNodeId: 'pain' },
      { label: "Dental injury", nextNodeId: 'injury' },
      { label: "Other dental problem", nextNodeId: 'other' },
    ]
  },
  swelling: {
    id: 'swelling',
    question: "Where is the swelling?",
    options: [
      { label: "Extending to eye or neck", action: 'call-999', severity: 'critical' },
      { label: "Only around tooth/gum", nextNodeId: 'swelling-fever' },
    ]
  },
  'swelling-fever': {
    id: 'swelling-fever',
    question: "Do you have a fever?",
    options: [
      { label: "Yes, with chills or feeling very unwell", action: 'call-999', severity: 'critical' },
      { label: "Yes, mild fever", action: 'call-111', severity: 'high' },
      { label: "No fever", action: 'find-dentist', severity: 'high' },
    ]
  },
  bleeding: {
    id: 'bleeding',
    question: "How long has it been bleeding?",
    options: [
      { label: "More than 20 minutes of continuous bleeding", action: 'find-ae', severity: 'critical' },
      { label: "Less than 20 minutes", nextNodeId: 'bleeding-cause' },
    ]
  },
  'bleeding-cause': {
    id: 'bleeding-cause',
    question: "What caused the bleeding?",
    options: [
      { label: "Injury or trauma", action: 'find-ae', severity: 'high' },
      { label: "After tooth extraction", action: 'call-111', severity: 'medium' },
      { label: "Spontaneous gum bleeding", action: 'find-dentist', severity: 'medium' },
    ]
  },
  pain: {
    id: 'pain',
    question: "How severe is the pain?",
    subtext: "On a scale of 1-10",
    options: [
      { label: "Unbearable (8-10) with swelling", action: 'call-111', severity: 'high' },
      { label: "Severe (6-8) but manageable", action: 'find-dentist', severity: 'medium' },
      { label: "Moderate (3-5)", action: 'self-care', severity: 'low' },
    ]
  },
  injury: {
    id: 'injury',
    question: "What type of injury?",
    options: [
      { label: "Knocked out adult tooth", action: 'find-dentist', severity: 'critical' },
      { label: "Broken jaw or facial bones", action: 'call-999', severity: 'critical' },
      { label: "Chipped or broken tooth", action: 'find-dentist', severity: 'medium' },
      { label: "Cut to lips or gums", nextNodeId: 'bleeding' },
    ]
  },
  other: {
    id: 'other',
    question: "What's the main issue?",
    options: [
      { label: "Lost filling or crown", action: 'find-dentist', severity: 'low' },
      { label: "Wisdom tooth pain", action: 'find-dentist', severity: 'medium' },
      { label: "Broken denture", action: 'find-dentist', severity: 'low' },
      { label: "Something else", action: 'call-111', severity: 'medium' },
    ]
  },
}

const actionDetails = {
  'call-999': {
    title: 'Call 999 Immediately',
    description: 'This is a medical emergency requiring immediate attention.',
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-300',
  },
  'call-111': {
    title: 'Call NHS 111',
    description: 'You need urgent dental advice. NHS 111 can help.',
    icon: Phone,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
  },
  'find-ae': {
    title: 'Go to A&E',
    description: 'You need emergency treatment at a hospital.',
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-300',
  },
  'find-dentist': {
    title: 'See Emergency Dentist',
    description: 'You need to see a dentist urgently.',
    icon: MapPin,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
  },
  'self-care': {
    title: 'Self-Care Recommended',
    description: 'You can manage this at home for now. See a dentist if it worsens.',
    icon: HelpCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
  },
}

export function EmergencyDecisionTree() {
  const [currentNodeId, setCurrentNodeId] = useState('start')
  const [history, setHistory] = useState<string[]>([])
  const [recommendation, setRecommendation] = useState<string | null>(null)

  const currentNode = decisionTree[currentNodeId]

  const handleOptionClick = (option: typeof currentNode.options[0]) => {
    if (option.action) {
      setRecommendation(option.action)
      EmergencyLogger.symptomCheck(
        [...history, currentNode.question, option.label],
        option.severity || 'medium',
        option.action
      )
    } else if (option.nextNodeId) {
      setHistory([...history, currentNode.question])
      setCurrentNodeId(option.nextNodeId)
    }
  }

  const handleReset = () => {
    setCurrentNodeId('start')
    setHistory([])
    setRecommendation(null)
  }

  const handleBack = () => {
    if (history.length > 0) {
      const newHistory = [...history]
      newHistory.pop()
      setHistory(newHistory)
      
      // Find the previous node
      if (newHistory.length === 0) {
        setCurrentNodeId('start')
      } else {
        // This is simplified - in production you'd track the full path
        setCurrentNodeId('start')
      }
    }
  }

  if (recommendation) {
    const action = actionDetails[recommendation]
    const Icon = action.icon

    return (
      <Card className={`border-2 ${action.borderColor}`}>
        <CardHeader className={action.bgColor}>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`h-6 w-6 ${action.color}`} />
            <span>{action.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Alert className={`${action.bgColor} ${action.borderColor} mb-4`}>
            <AlertDescription className="text-base font-medium">
              {action.description}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {recommendation === 'call-999' && (
              <Button size="lg" className="w-full bg-red-600 hover:bg-red-700" asChild>
                <a href="tel:999">
                  <Phone className="mr-2" />
                  Call 999 Now
                </a>
              </Button>
            )}
            
            {recommendation === 'call-111' && (
              <Button size="lg" className="w-full" asChild>
                <a href="tel:111">
                  <Phone className="mr-2" />
                  Call NHS 111
                </a>
              </Button>
            )}
            
            {recommendation === 'find-ae' && (
              <Button size="lg" className="w-full" asChild>
                <a href="https://www.nhs.uk/service-search/accident-and-emergency-services/locationsearch/428" target="_blank">
                  <MapPin className="mr-2" />
                  Find Nearest A&E
                </a>
              </Button>
            )}
            
            {recommendation === 'find-dentist' && (
              <Button size="lg" className="w-full" asChild>
                <a href="/find-dentist?emergency=true">
                  <MapPin className="mr-2" />
                  Find Emergency Dentist
                </a>
              </Button>
            )}

            <Button variant="outline" onClick={handleReset} className="w-full">
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
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Not Sure What To Do?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">{currentNode.question}</h3>
            {currentNode.subtext && (
              <p className="text-sm text-gray-600">{currentNode.subtext}</p>
            )}
          </div>

          <div className="space-y-2">
            {currentNode.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-between text-left h-auto py-3 px-4"
                onClick={() => handleOptionClick(option)}
              >
                <span className="pr-2">{option.label}</span>
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              </Button>
            ))}
          </div>

          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-gray-600"
            >
              ← Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}