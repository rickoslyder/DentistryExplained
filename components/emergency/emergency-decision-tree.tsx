"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { HelpCircle, Phone, AlertTriangle, MapPin, ChevronRight, Activity, Droplet, Brain, Baby, Heart, Clock, Thermometer, Home, ChevronLeft, CheckCircle, XCircle, Info } from 'lucide-react'
import { EmergencyLogger } from '@/lib/emergency-audit'

interface DecisionNode {
  id: string
  question: string
  subtext?: string
  icon?: React.ElementType
  options: {
    label: string
    icon?: React.ElementType
    nextNodeId?: string
    action?: 'call-999' | 'call-111' | 'find-ae' | 'find-dentist' | 'self-care'
    severity?: 'critical' | 'high' | 'medium' | 'low'
    timeframe?: string
  }[]
}

interface PathStep {
  question: string
  answer: string
  nodeId: string
}

const decisionTree: Record<string, DecisionNode> = {
  start: {
    id: 'start',
    question: "Who needs help?",
    subtext: "This affects our recommendations",
    icon: HelpCircle,
    options: [
      { label: "Adult (18+)", icon: Heart, nextNodeId: 'adult-symptoms' },
      { label: "Child (under 18)", icon: Baby, nextNodeId: 'child-symptoms' },
      { label: "Pregnant person", icon: Heart, nextNodeId: 'pregnancy-symptoms' },
    ]
  },
  'adult-symptoms': {
    id: 'adult-symptoms',
    question: "What's the main problem?",
    subtext: "Select the most severe symptom if multiple apply",
    icon: Activity,
    options: [
      { label: "Difficulty breathing or swallowing", icon: AlertTriangle, action: 'call-999', severity: 'critical', timeframe: 'Immediate' },
      { label: "Severe facial swelling", icon: Activity, nextNodeId: 'swelling' },
      { label: "Uncontrolled bleeding", icon: Droplet, nextNodeId: 'bleeding' },
      { label: "Severe pain", icon: Brain, nextNodeId: 'pain' },
      { label: "Dental injury", icon: AlertTriangle, nextNodeId: 'injury' },
      { label: "Tooth knocked loose", icon: AlertTriangle, nextNodeId: 'loose-tooth' },
      { label: "After dental procedure", icon: Clock, nextNodeId: 'post-procedure' },
      { label: "Other dental problem", icon: HelpCircle, nextNodeId: 'other' },
    ]
  },
  'child-symptoms': {
    id: 'child-symptoms',
    question: "What's happening with your child?",
    subtext: "Children may need different care than adults",
    icon: Baby,
    options: [
      { label: "Difficulty breathing or swallowing", icon: AlertTriangle, action: 'call-999', severity: 'critical', timeframe: 'Immediate' },
      { label: "High fever with dental pain", icon: Thermometer, nextNodeId: 'child-fever' },
      { label: "Facial swelling", icon: Activity, action: 'call-999', severity: 'critical', timeframe: 'Immediate' },
      { label: "Knocked out baby tooth", icon: AlertTriangle, nextNodeId: 'baby-tooth' },
      { label: "Knocked out adult tooth", icon: AlertTriangle, action: 'find-dentist', severity: 'critical', timeframe: '30 minutes' },
      { label: "Severe pain", icon: Brain, nextNodeId: 'child-pain' },
      { label: "Bleeding", icon: Droplet, nextNodeId: 'child-bleeding' },
      { label: "Other concern", icon: HelpCircle, action: 'call-111', severity: 'medium' },
    ]
  },
  'pregnancy-symptoms': {
    id: 'pregnancy-symptoms',
    question: "What dental issue are you experiencing?",
    subtext: "Pregnancy affects dental treatment options",
    icon: Heart,
    options: [
      { label: "Severe swelling or infection signs", icon: AlertTriangle, action: 'call-999', severity: 'critical', timeframe: 'Immediate' },
      { label: "Uncontrolled bleeding gums", icon: Droplet, action: 'call-111', severity: 'high', timeframe: '1 hour' },
      { label: "Severe pain", icon: Brain, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
      { label: "Routine dental problem", icon: HelpCircle, nextNodeId: 'pregnancy-routine' },
    ]
  },
  swelling: {
    id: 'swelling',
    question: "Describe the swelling",
    icon: Activity,
    options: [
      { label: "Extending to eye, making it hard to open", icon: AlertTriangle, action: 'call-999', severity: 'critical', timeframe: 'Immediate' },
      { label: "Extending down to neck", icon: AlertTriangle, action: 'call-999', severity: 'critical', timeframe: 'Immediate' },
      { label: "Warm, red, and spreading", icon: Thermometer, nextNodeId: 'swelling-sepsis-check' },
      { label: "Localized to gum/cheek area", icon: Activity, nextNodeId: 'swelling-fever' },
    ]
  },
  'swelling-sepsis-check': {
    id: 'swelling-sepsis-check',
    question: "Do you have any of these symptoms?",
    subtext: "These could indicate sepsis - a medical emergency",
    icon: AlertTriangle,
    options: [
      { label: "Confusion or difficulty staying awake", icon: Brain, action: 'call-999', severity: 'critical', timeframe: 'Immediate' },
      { label: "Rapid heartbeat or breathing", icon: Heart, action: 'call-999', severity: 'critical', timeframe: 'Immediate' },
      { label: "Fever above 38.5°C (101°F)", icon: Thermometer, action: 'call-999', severity: 'critical', timeframe: 'Immediate' },
      { label: "None of these", icon: CheckCircle, nextNodeId: 'swelling-fever' },
    ]
  },
  'swelling-fever': {
    id: 'swelling-fever',
    question: "What's your temperature?",
    icon: Thermometer,
    options: [
      { label: "Above 38.5°C (101°F) with chills", icon: Thermometer, action: 'call-999', severity: 'critical', timeframe: 'Immediate' },
      { label: "37.5-38.5°C (99.5-101°F)", icon: Thermometer, action: 'call-111', severity: 'high', timeframe: '1 hour' },
      { label: "Normal temperature", icon: CheckCircle, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
      { label: "Not sure", icon: HelpCircle, action: 'call-111', severity: 'high' },
    ]
  },
  bleeding: {
    id: 'bleeding',
    question: "How long has it been bleeding?",
    icon: Droplet,
    options: [
      { label: "More than 30 minutes continuously", icon: AlertTriangle, action: 'find-ae', severity: 'critical', timeframe: 'Immediate' },
      { label: "20-30 minutes", icon: Clock, nextNodeId: 'bleeding-severity' },
      { label: "Less than 20 minutes", icon: Clock, nextNodeId: 'bleeding-cause' },
    ]
  },
  'bleeding-severity': {
    id: 'bleeding-severity',
    question: "How severe is the bleeding?",
    icon: Droplet,
    options: [
      { label: "Heavy, soaking through gauze quickly", icon: AlertTriangle, action: 'find-ae', severity: 'critical', timeframe: 'Immediate' },
      { label: "Moderate but not stopping", icon: Droplet, action: 'call-111', severity: 'high', timeframe: '1 hour' },
      { label: "Slow but continuous", icon: Droplet, nextNodeId: 'bleeding-cause' },
    ]
  },
  'bleeding-cause': {
    id: 'bleeding-cause',
    question: "What caused the bleeding?",
    icon: Info,
    options: [
      { label: "Injury or trauma", icon: AlertTriangle, action: 'find-ae', severity: 'high', timeframe: '1 hour' },
      { label: "After tooth extraction today", icon: Clock, nextNodeId: 'post-extraction' },
      { label: "After dental work (>24 hours ago)", icon: Clock, action: 'call-111', severity: 'medium', timeframe: '2 hours' },
      { label: "Spontaneous gum bleeding", icon: Droplet, nextNodeId: 'bleeding-medical' },
    ]
  },
  'post-extraction': {
    id: 'post-extraction',
    question: "When was the tooth extracted?",
    icon: Clock,
    options: [
      { label: "Less than 2 hours ago", icon: Clock, action: 'self-care', severity: 'low', timeframe: 'Monitor' },
      { label: "2-6 hours ago", icon: Clock, action: 'call-111', severity: 'medium', timeframe: '2 hours' },
      { label: "More than 6 hours ago", icon: Clock, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
    ]
  },
  'bleeding-medical': {
    id: 'bleeding-medical',
    question: "Do you take blood thinners or have a bleeding disorder?",
    icon: Heart,
    options: [
      { label: "Yes, I take blood thinners", icon: Heart, action: 'call-111', severity: 'high', timeframe: '1 hour' },
      { label: "Yes, I have a bleeding disorder", icon: Heart, action: 'find-ae', severity: 'critical', timeframe: 'Immediate' },
      { label: "No medical conditions", icon: CheckCircle, action: 'find-dentist', severity: 'medium', timeframe: 'Same day' },
    ]
  },
  pain: {
    id: 'pain',
    question: "Rate your pain level",
    subtext: "0 = no pain, 10 = worst pain imaginable",
    icon: Brain,
    options: [
      { label: "Unbearable (8-10)", icon: AlertTriangle, nextNodeId: 'pain-symptoms' },
      { label: "Severe (6-7)", icon: Brain, nextNodeId: 'pain-duration' },
      { label: "Moderate (4-5)", icon: Brain, nextNodeId: 'pain-type' },
      { label: "Mild (1-3)", icon: CheckCircle, action: 'self-care', severity: 'low' },
    ]
  },
  'pain-symptoms': {
    id: 'pain-symptoms',
    question: "Do you have any of these with the pain?",
    icon: AlertTriangle,
    options: [
      { label: "Swelling or fever", icon: Thermometer, action: 'call-111', severity: 'high', timeframe: '1 hour' },
      { label: "Can't open mouth fully", icon: AlertTriangle, action: 'find-ae', severity: 'critical', timeframe: 'Immediate' },
      { label: "Radiating to ear/neck", icon: Activity, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
      { label: "Just pain", icon: Brain, action: 'find-dentist', severity: 'medium', timeframe: 'Within 24 hours' },
    ]
  },
  'pain-duration': {
    id: 'pain-duration',
    question: "How long have you had this pain?",
    icon: Clock,
    options: [
      { label: "Started suddenly today", icon: AlertTriangle, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
      { label: "2-3 days", icon: Clock, action: 'find-dentist', severity: 'medium', timeframe: 'Within 24 hours' },
      { label: "More than 3 days", icon: Clock, nextNodeId: 'pain-worsening' },
    ]
  },
  'pain-worsening': {
    id: 'pain-worsening',
    question: "Is the pain getting worse?",
    icon: Activity,
    options: [
      { label: "Yes, rapidly worsening", icon: AlertTriangle, action: 'call-111', severity: 'high', timeframe: '1 hour' },
      { label: "Slowly getting worse", icon: Activity, action: 'find-dentist', severity: 'medium', timeframe: 'Within 24 hours' },
      { label: "Staying the same", icon: CheckCircle, action: 'find-dentist', severity: 'low', timeframe: 'Within 48 hours' },
    ]
  },
  'pain-type': {
    id: 'pain-type',
    question: "What type of pain is it?",
    icon: Brain,
    options: [
      { label: "Sharp when biting", icon: Brain, nextNodeId: 'pain-trigger' },
      { label: "Constant throbbing", icon: Activity, action: 'find-dentist', severity: 'medium', timeframe: 'Within 24 hours' },
      { label: "Sensitivity to hot/cold", icon: Thermometer, nextNodeId: 'sensitivity' },
      { label: "Jaw/TMJ pain", icon: Brain, nextNodeId: 'tmj-pain' },
    ]
  },
  'sensitivity': {
    id: 'sensitivity',
    question: "How long does the sensitivity last?",
    icon: Thermometer,
    options: [
      { label: "Lingers for minutes", icon: Clock, action: 'find-dentist', severity: 'medium', timeframe: 'Within 48 hours' },
      { label: "Brief seconds only", icon: Clock, action: 'self-care', severity: 'low' },
      { label: "Constant pain", icon: AlertTriangle, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
    ]
  },
  'tmj-pain': {
    id: 'tmj-pain',
    question: "Do you have any of these symptoms?",
    icon: Brain,
    options: [
      { label: "Jaw locked open/closed", icon: AlertTriangle, action: 'find-ae', severity: 'critical', timeframe: 'Immediate' },
      { label: "Clicking/popping sounds", icon: Activity, action: 'find-dentist', severity: 'low', timeframe: 'Within 1 week' },
      { label: "Pain when chewing", icon: Brain, action: 'find-dentist', severity: 'medium', timeframe: 'Within 48 hours' },
    ]
  },
  injury: {
    id: 'injury',
    question: "What type of injury?",
    icon: AlertTriangle,
    options: [
      { label: "Knocked out adult tooth", icon: AlertTriangle, action: 'find-dentist', severity: 'critical', timeframe: '30 minutes' },
      { label: "Broken jaw or facial bones", icon: AlertTriangle, action: 'call-999', severity: 'critical', timeframe: 'Immediate' },
      { label: "Tooth knocked loose but still there", icon: AlertTriangle, nextNodeId: 'loose-tooth' },
      { label: "Chipped or broken tooth", icon: Brain, nextNodeId: 'broken-tooth' },
      { label: "Cut to lips, tongue or gums", icon: Droplet, nextNodeId: 'bleeding' },
    ]
  },
  'loose-tooth': {
    id: 'loose-tooth',
    question: "How loose is the tooth?",
    icon: AlertTriangle,
    options: [
      { label: "Very loose, barely attached", icon: AlertTriangle, action: 'find-dentist', severity: 'critical', timeframe: '1 hour' },
      { label: "Slightly loose, can wiggle it", icon: Activity, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
      { label: "Pushed back/forward/sideways", icon: AlertTriangle, action: 'find-dentist', severity: 'critical', timeframe: '1 hour' },
    ]
  },
  'broken-tooth': {
    id: 'broken-tooth',
    question: "How is the tooth broken?",
    icon: Brain,
    options: [
      { label: "Large piece missing, nerve exposed", icon: AlertTriangle, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
      { label: "Sharp/jagged edge cutting mouth", icon: AlertTriangle, action: 'find-dentist', severity: 'medium', timeframe: 'Within 24 hours' },
      { label: "Small chip, no pain", icon: CheckCircle, action: 'find-dentist', severity: 'low', timeframe: 'Within 1 week' },
    ]
  },
  other: {
    id: 'other',
    question: "What's the main issue?",
    icon: HelpCircle,
    options: [
      { label: "Lost filling or crown", icon: Brain, nextNodeId: 'lost-restoration' },
      { label: "Wisdom tooth pain", icon: Brain, action: 'find-dentist', severity: 'medium', timeframe: 'Within 48 hours' },
      { label: "Broken denture/brace", icon: Brain, action: 'find-dentist', severity: 'low', timeframe: 'Within 1 week' },
      { label: "Mouth ulcers/sores", icon: Activity, nextNodeId: 'mouth-sores' },
      { label: "Something else", icon: HelpCircle, action: 'call-111', severity: 'medium' },
    ]
  },
  'lost-restoration': {
    id: 'lost-restoration',
    question: "Are you having pain or sensitivity?",
    icon: Brain,
    options: [
      { label: "Severe pain", icon: AlertTriangle, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
      { label: "Sensitivity to hot/cold", icon: Thermometer, action: 'find-dentist', severity: 'medium', timeframe: 'Within 48 hours' },
      { label: "No pain", icon: CheckCircle, action: 'find-dentist', severity: 'low', timeframe: 'Within 1 week' },
    ]
  },
  'mouth-sores': {
    id: 'mouth-sores',
    question: "How long have you had the sores?",
    icon: Activity,
    options: [
      { label: "More than 2 weeks", icon: AlertTriangle, action: 'find-dentist', severity: 'high', timeframe: 'Within 48 hours' },
      { label: "Less than 2 weeks", icon: Clock, nextNodeId: 'sore-symptoms' },
    ]
  },
  'sore-symptoms': {
    id: 'sore-symptoms',
    question: "Do you have any of these symptoms?",
    icon: Info,
    options: [
      { label: "Fever or difficulty swallowing", icon: Thermometer, action: 'call-111', severity: 'high', timeframe: '2 hours' },
      { label: "Multiple large sores", icon: Activity, action: 'find-dentist', severity: 'medium', timeframe: 'Within 48 hours' },
      { label: "Small sores only", icon: CheckCircle, action: 'self-care', severity: 'low' },
    ]
  },
  'post-procedure': {
    id: 'post-procedure',
    question: "What procedure did you have?",
    icon: Clock,
    options: [
      { label: "Tooth extraction", icon: Brain, nextNodeId: 'extraction-timing' },
      { label: "Root canal", icon: Brain, nextNodeId: 'root-canal-symptoms' },
      { label: "Filling or crown", icon: Brain, nextNodeId: 'filling-symptoms' },
      { label: "Other procedure", icon: HelpCircle, action: 'call-111', severity: 'medium' },
    ]
  },
  'extraction-timing': {
    id: 'extraction-timing',
    question: "When was the extraction?",
    icon: Clock,
    options: [
      { label: "Today", icon: Clock, nextNodeId: 'extraction-symptoms' },
      { label: "1-3 days ago", icon: Clock, nextNodeId: 'extraction-symptoms' },
      { label: "More than 3 days ago", icon: Clock, nextNodeId: 'dry-socket' },
    ]
  },
  'extraction-symptoms': {
    id: 'extraction-symptoms',
    question: "What symptoms are you having?",
    icon: Activity,
    options: [
      { label: "Heavy bleeding won't stop", icon: Droplet, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
      { label: "Severe pain getting worse", icon: Brain, action: 'find-dentist', severity: 'medium', timeframe: 'Within 24 hours' },
      { label: "Mild pain and swelling", icon: Activity, action: 'self-care', severity: 'low' },
    ]
  },
  'dry-socket': {
    id: 'dry-socket',
    question: "Do you have severe pain and bad taste?",
    subtext: "This could be dry socket",
    icon: AlertTriangle,
    options: [
      { label: "Yes, severe pain and bad taste", icon: AlertTriangle, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
      { label: "Just some discomfort", icon: Activity, action: 'self-care', severity: 'low' },
    ]
  },
  'child-fever': {
    id: 'child-fever',
    question: "What's the child's temperature?",
    icon: Thermometer,
    options: [
      { label: "Above 39°C (102°F)", icon: AlertTriangle, action: 'call-999', severity: 'critical', timeframe: 'Immediate' },
      { label: "38-39°C (100-102°F)", icon: Thermometer, action: 'call-111', severity: 'high', timeframe: '1 hour' },
      { label: "Below 38°C (100°F)", icon: CheckCircle, action: 'find-dentist', severity: 'medium', timeframe: 'Same day' },
    ]
  },
  'baby-tooth': {
    id: 'baby-tooth',
    question: "Is there any other injury?",
    subtext: "Baby teeth usually aren't reimplanted",
    icon: Baby,
    options: [
      { label: "Bleeding that won't stop", icon: Droplet, nextNodeId: 'child-bleeding' },
      { label: "Other teeth damaged", icon: AlertTriangle, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
      { label: "Just the knocked out tooth", icon: CheckCircle, action: 'find-dentist', severity: 'low', timeframe: 'Within 48 hours' },
    ]
  },
  'child-pain': {
    id: 'child-pain',
    question: "Can the child eat or sleep?",
    icon: Baby,
    options: [
      { label: "Can't eat or sleep", icon: AlertTriangle, action: 'find-dentist', severity: 'high', timeframe: 'Same day' },
      { label: "Some difficulty", icon: Activity, action: 'find-dentist', severity: 'medium', timeframe: 'Within 24 hours' },
      { label: "Managing okay", icon: CheckCircle, action: 'self-care', severity: 'low' },
    ]
  },
  'child-bleeding': {
    id: 'child-bleeding',
    question: "How much is it bleeding?",
    icon: Droplet,
    options: [
      { label: "Heavy bleeding for >15 minutes", icon: AlertTriangle, action: 'find-ae', severity: 'critical', timeframe: 'Immediate' },
      { label: "Moderate bleeding", icon: Droplet, action: 'call-111', severity: 'high', timeframe: '1 hour' },
      { label: "Light bleeding/oozing", icon: CheckCircle, action: 'self-care', severity: 'low' },
    ]
  },
  'pregnancy-routine': {
    id: 'pregnancy-routine',
    question: "What trimester are you in?",
    icon: Heart,
    options: [
      { label: "First trimester (0-12 weeks)", icon: Heart, action: 'find-dentist', severity: 'low', timeframe: 'Non-urgent' },
      { label: "Second trimester (13-27 weeks)", icon: Heart, action: 'find-dentist', severity: 'low', timeframe: 'Routine care okay' },
      { label: "Third trimester (28+ weeks)", icon: Heart, action: 'find-dentist', severity: 'low', timeframe: 'Emergency only' },
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
  const [path, setPath] = useState<PathStep[]>([])
  const [recommendation, setRecommendation] = useState<string | null>(null)

  const currentNode = decisionTree[currentNodeId]

  const handleOptionClick = (option: typeof currentNode.options[0]) => {
    const newPathStep: PathStep = {
      question: currentNode.question,
      answer: option.label,
      nodeId: currentNodeId
    }
    setPath([...path, newPathStep])

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
    setPath([])
    setRecommendation(null)
  }

  const handleBack = () => {
    if (path.length > 0) {
      const newPath = [...path]
      newPath.pop()
      setPath(newPath)
      
      if (newPath.length === 0) {
        setCurrentNodeId('start')
        setHistory([])
      } else {
        const previousStep = newPath[newPath.length - 1]
        setCurrentNodeId(previousStep.nodeId)
        setHistory(newPath.map(step => step.question))
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
          {/* Decision Path Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Your symptoms:</h4>
            <div className="space-y-1">
              {path.map((step, index) => (
                <div key={index} className="flex items-center text-sm">
                  <ChevronRight className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-gray-600">{step.question}:</span>
                  <span className="ml-1 font-medium text-gray-900">{step.answer}</span>
                </div>
              ))}
            </div>
          </div>

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
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <span className="text-gray-900">Not Sure What To Do?</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Progress Indicator */}
        {path.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Progress</span>
              <span className="text-xs text-gray-500">{path.length} of ~4 steps</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min((path.length / 4) * 100, 90)}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {currentNode.icon && (
              <div className="mt-1">
                <currentNode.icon className="h-5 w-5 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">{currentNode.question}</h3>
              {currentNode.subtext && (
                <p className="text-sm text-gray-600">{currentNode.subtext}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {currentNode.options.map((option, index) => {
              const severityColors = {
                critical: 'hover:border-red-300 hover:bg-red-50',
                high: 'hover:border-orange-300 hover:bg-orange-50',
                medium: 'hover:border-yellow-300 hover:bg-yellow-50',
                low: 'hover:border-green-300 hover:bg-green-50'
              }
              const hoverClass = option.severity ? severityColors[option.severity] : 'hover:bg-gray-50'
              
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`w-full justify-between text-left h-auto py-3 px-4 transition-all ${hoverClass} group`}
                  onClick={() => handleOptionClick(option)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {option.icon && (
                      <option.icon className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                    )}
                    <div className="flex-1">
                      <span className="block">{option.label}</span>
                      {option.timeframe && (
                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {option.timeframe}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-400 group-hover:text-gray-600" />
                </Button>
              )
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            {path.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            ) : (
              <div /> // Empty div for spacing
            )}
            
            {path.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-gray-500 hover:text-gray-700"
              >
                Start over
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}