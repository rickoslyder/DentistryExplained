"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Clock, AlertCircle, CheckCircle, Phone, FileText, Timer } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { EmergencyCountdownTimer } from './emergency-countdown-timer'

interface TimelineStep {
  time: string
  title: string
  description: string
  completed: boolean
  icon: React.ComponentType<{ className?: string }>
  action?: {
    label: string
    onClick: () => void
  }
}

interface EmergencyTimelineProps {
  emergencyType: 'knocked-out-tooth' | 'severe-pain' | 'bleeding' | 'general'
  showTimer?: boolean
}

export function EmergencyTimeline({ emergencyType, showTimer = true }: EmergencyTimelineProps) {
  const [startTime] = useState(new Date())
  const [currentTime, setCurrentTime] = useState(new Date())
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getTimeline = (): TimelineStep[] => {
    switch (emergencyType) {
      case 'knocked-out-tooth':
        return [
          {
            time: 'Immediately',
            title: 'Find the tooth',
            description: 'Handle by the crown only, never touch the root',
            completed: completedSteps.has(0),
            icon: AlertCircle,
          },
          {
            time: 'Within 5 minutes',
            title: 'Rinse if dirty',
            description: 'Use milk or saline solution, NOT water',
            completed: completedSteps.has(1),
            icon: CheckCircle,
          },
          {
            time: 'Within 10 minutes',
            title: 'Attempt reinsertion',
            description: 'Gently push tooth back into socket if possible',
            completed: completedSteps.has(2),
            icon: AlertCircle,
          },
          {
            time: 'Within 15 minutes',
            title: 'Store properly',
            description: 'If reinsertion fails, store in milk or saliva',
            completed: completedSteps.has(3),
            icon: CheckCircle,
          },
          {
            time: 'Within 30 minutes',
            title: 'Reach emergency dentist',
            description: 'Critical window for successful reimplantation',
            completed: completedSteps.has(4),
            icon: Phone,
            action: {
              label: 'Find Emergency Dentist',
              onClick: () => window.location.href = '/find-dentist?emergency=true',
            },
          },
        ]
      
      case 'severe-pain':
        return [
          {
            time: 'Immediately',
            title: 'Take pain relief',
            description: 'Follow dosage instructions on package',
            completed: completedSteps.has(0),
            icon: CheckCircle,
          },
          {
            time: 'Within 10 minutes',
            title: 'Apply cold compress',
            description: 'On outside of cheek for 15-20 minutes',
            completed: completedSteps.has(1),
            icon: CheckCircle,
          },
          {
            time: 'Within 30 minutes',
            title: 'Contact dental service',
            description: 'Call NHS 111 or emergency dentist',
            completed: completedSteps.has(2),
            icon: Phone,
            action: {
              label: 'Call NHS 111',
              onClick: () => window.location.href = 'tel:111',
            },
          },
          {
            time: 'As directed',
            title: 'Attend appointment',
            description: 'Follow advice from dental professional',
            completed: completedSteps.has(3),
            icon: FileText,
          },
        ]
      
      case 'bleeding':
        return [
          {
            time: 'Immediately',
            title: 'Apply pressure',
            description: 'Use clean gauze or cloth, bite down firmly',
            completed: completedSteps.has(0),
            icon: AlertCircle,
          },
          {
            time: '10-15 minutes',
            title: 'Maintain pressure',
            description: 'Do not keep checking - maintain constant pressure',
            completed: completedSteps.has(1),
            icon: Clock,
          },
          {
            time: 'After 30 minutes',
            title: 'Check bleeding',
            description: 'If still bleeding heavily, seek emergency care',
            completed: completedSteps.has(2),
            icon: CheckCircle,
          },
          {
            time: 'If persistent',
            title: 'Emergency care',
            description: 'Call 999 or go to A&E for uncontrolled bleeding',
            completed: completedSteps.has(3),
            icon: Phone,
            action: {
              label: 'Call 999',
              onClick: () => window.location.href = 'tel:999',
            },
          },
        ]
      
      default:
        return [
          {
            time: 'Now',
            title: 'Assess symptoms',
            description: 'Determine severity of your condition',
            completed: completedSteps.has(0),
            icon: CheckCircle,
          },
          {
            time: 'Next',
            title: 'First aid measures',
            description: 'Apply appropriate first aid based on symptoms',
            completed: completedSteps.has(1),
            icon: CheckCircle,
          },
          {
            time: 'Within 1 hour',
            title: 'Contact services',
            description: 'Call NHS 111 or emergency dentist',
            completed: completedSteps.has(2),
            icon: Phone,
          },
          {
            time: 'As advised',
            title: 'Follow guidance',
            description: 'Attend appointment or A&E as directed',
            completed: completedSteps.has(3),
            icon: FileText,
          },
        ]
    }
  }

  const timeline = getTimeline()
  const elapsedTime = formatDistanceToNow(startTime, { includeSeconds: true })

  const toggleStep = (index: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(index)) {
      newCompleted.delete(index)
    } else {
      newCompleted.add(index)
    }
    setCompletedSteps(newCompleted)
  }

  const getUrgencyColor = () => {
    const elapsedMinutes = (currentTime.getTime() - startTime.getTime()) / 60000
    
    if (emergencyType === 'knocked-out-tooth') {
      if (elapsedMinutes < 30) return 'text-green-600'
      if (elapsedMinutes < 60) return 'text-yellow-600'
      return 'text-red-600'
    }
    
    if (elapsedMinutes < 60) return 'text-green-600'
    if (elapsedMinutes < 120) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Show countdown timer for time-critical emergencies */}
      {showTimer && (emergencyType === 'knocked-out-tooth' || emergencyType === 'bleeding') && (
        <EmergencyCountdownTimer
          emergencyType={emergencyType === 'knocked-out-tooth' ? 'knocked-out-tooth' : 'severe-bleeding'}
          initialMinutes={emergencyType === 'knocked-out-tooth' ? 30 : 60}
          criticalMinutes={emergencyType === 'knocked-out-tooth' ? 15 : 20}
        />
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Emergency Timeline
              </CardTitle>
              <CardDescription>
                Follow these time-critical steps
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Time elapsed</div>
              <div className={`text-lg font-semibold ${getUrgencyColor()}`}>
                {elapsedTime}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        <div className="space-y-4">
          {timeline.map((step, index) => {
            const StepIcon = step.icon
            return (
              <div 
                key={index}
                className={`relative flex gap-4 pb-4 ${
                  index < timeline.length - 1 ? 'border-l-2 border-gray-200 ml-4' : ''
                }`}
              >
                <div 
                  className={`absolute -left-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                    step.completed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  onClick={() => toggleStep(index)}
                >
                  <StepIcon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 ml-8">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium ${
                      step.completed ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </h4>
                    <span className="text-sm text-gray-500">{step.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  
                  {step.action && (
                    <Button
                      size="sm"
                      variant={step.completed ? "outline" : "default"}
                      onClick={step.action.onClick}
                      className="mt-2"
                    >
                      {step.action.label}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {emergencyType === 'knocked-out-tooth' && (
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Time is Critical!</AlertTitle>
            <AlertDescription>
              Best chance of saving the tooth is within 30 minutes. After 60 minutes, success rate drops significantly.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
    </div>
  )
}