'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Video, 
  Wifi, 
  Monitor,
  Smartphone,
  Headphones,
  Camera,
  Clock,
  Calendar,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle
} from 'lucide-react'

export interface VideoConsultationInfo {
  platform: 'zoom' | 'teams' | 'google-meet' | 'custom'
  meetingLink?: string
  meetingId?: string
  password?: string
  scheduledTime?: string
  duration?: string
  dentistName?: string
  instructions?: string[]
  technicalRequirements?: string[]
  preparationChecklist?: string[]
}

interface VideoConsultationCardProps {
  consultation: VideoConsultationInfo
  className?: string
  showChecklist?: boolean
  onJoinMeeting?: () => void
}

export function VideoConsultationCard({ 
  consultation, 
  className,
  showChecklist = true,
  onJoinMeeting
}: VideoConsultationCardProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [deviceTestResults, setDeviceTestResults] = useState<{
    camera: boolean | null
    microphone: boolean | null
    internet: boolean | null
  }>({
    camera: null,
    microphone: null,
    internet: null
  })

  const platformInfo = {
    zoom: {
      name: 'Zoom',
      icon: Video,
      color: 'bg-blue-600',
      joinText: 'Join Zoom Meeting'
    },
    teams: {
      name: 'Microsoft Teams',
      icon: Monitor,
      color: 'bg-purple-600',
      joinText: 'Join Teams Meeting'
    },
    'google-meet': {
      name: 'Google Meet',
      icon: Video,
      color: 'bg-green-600',
      joinText: 'Join Google Meet'
    },
    custom: {
      name: 'Video Consultation',
      icon: Video,
      color: 'bg-gray-600',
      joinText: 'Join Meeting'
    }
  }

  const platform = platformInfo[consultation.platform]

  const defaultRequirements = [
    'Stable internet connection (minimum 5 Mbps)',
    'Working webcam/camera',
    'Working microphone and speakers/headphones',
    'Updated web browser (Chrome, Firefox, Safari, or Edge)',
    'Quiet, well-lit environment'
  ]

  const defaultChecklist = [
    'Find a quiet, private location',
    'Ensure good lighting (face the light source)',
    'Test your camera and microphone',
    'Close unnecessary applications',
    'Have your ID and insurance information ready',
    'Prepare a list of questions or concerns',
    'Have a pen and paper for notes'
  ]

  const requirements = consultation.technicalRequirements || defaultRequirements
  const checklist = consultation.preparationChecklist || defaultChecklist

  const handleCheckItem = (item: string) => {
    const newCheckedItems = new Set(checkedItems)
    if (newCheckedItems.has(item)) {
      newCheckedItems.delete(item)
    } else {
      newCheckedItems.add(item)
    }
    setCheckedItems(newCheckedItems)
  }

  const testDevices = async () => {
    try {
      // Test camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      setDeviceTestResults(prev => ({
        ...prev,
        camera: true,
        microphone: true
      }))
      stream.getTracks().forEach(track => track.stop())
    } catch (error) {
      setDeviceTestResults(prev => ({
        ...prev,
        camera: false,
        microphone: false
      }))
    }

    // Test internet connection (simplified)
    try {
      const startTime = Date.now()
      await fetch('https://www.google.com/favicon.ico?' + startTime, { mode: 'no-cors' })
      const latency = Date.now() - startTime
      setDeviceTestResults(prev => ({
        ...prev,
        internet: latency < 1000 // Good if less than 1 second
      }))
    } catch {
      setDeviceTestResults(prev => ({
        ...prev,
        internet: false
      }))
    }
  }

  const allChecklistComplete = checklist.every(item => checkedItems.has(item))

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg text-white", platform.color)}>
              <platform.icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle>Video Consultation</CardTitle>
              <CardDescription>{platform.name}</CardDescription>
            </div>
          </div>
          <Badge variant="outline">
            <Video className="h-3 w-3 mr-1" />
            Online
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Meeting Details */}
        <div className="space-y-3">
          {consultation.dentistName && (
            <div className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">With:</span>
              <span>{consultation.dentistName}</span>
            </div>
          )}
          
          {consultation.scheduledTime && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Time:</span>
              <span>{consultation.scheduledTime}</span>
            </div>
          )}
          
          {consultation.duration && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Duration:</span>
              <span>{consultation.duration}</span>
            </div>
          )}
          
          {consultation.meetingId && (
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Meeting ID:</span>
              <code className="bg-muted px-2 py-0.5 rounded">{consultation.meetingId}</code>
            </div>
          )}
          
          {consultation.password && (
            <div className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Password:</span>
              <code className="bg-muted px-2 py-0.5 rounded">{consultation.password}</code>
            </div>
          )}
        </div>

        <Separator />

        {/* Join Meeting Button */}
        <div className="space-y-3">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => {
              if (consultation.meetingLink) {
                window.open(consultation.meetingLink, '_blank')
              }
              onJoinMeeting?.()
            }}
            disabled={!consultation.meetingLink && !onJoinMeeting}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {platform.joinText}
          </Button>
          
          {consultation.instructions && consultation.instructions.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Instructions:</p>
                <ul className="list-disc list-inside space-y-1">
                  {consultation.instructions.map((instruction, index) => (
                    <li key={index} className="text-sm">{instruction}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <Separator />

        {/* Technical Requirements */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Technical Requirements
          </h4>
          <div className="space-y-2">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{req}</span>
              </div>
            ))}
          </div>
          
          {/* Device Test */}
          <div className="pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={testDevices}
              className="w-full"
            >
              <Wifi className="h-4 w-4 mr-2" />
              Test My Device
            </Button>
            
            {(deviceTestResults.camera !== null || 
              deviceTestResults.microphone !== null || 
              deviceTestResults.internet !== null) && (
              <div className="mt-3 space-y-2">
                {deviceTestResults.camera !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    {deviceTestResults.camera ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Camera {deviceTestResults.camera ? 'working' : 'not detected'}</span>
                  </div>
                )}
                
                {deviceTestResults.microphone !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    {deviceTestResults.microphone ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Microphone {deviceTestResults.microphone ? 'working' : 'not detected'}</span>
                  </div>
                )}
                
                {deviceTestResults.internet !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    {deviceTestResults.internet ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Internet connection {deviceTestResults.internet ? 'good' : 'slow/unstable'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Preparation Checklist */}
        {showChecklist && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Preparation Checklist
              </h4>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Checkbox
                      id={`checklist-${index}`}
                      checked={checkedItems.has(item)}
                      onCheckedChange={() => handleCheckItem(item)}
                    />
                    <label
                      htmlFor={`checklist-${index}`}
                      className={cn(
                        "text-sm cursor-pointer",
                        checkedItems.has(item) && "line-through text-muted-foreground"
                      )}
                    >
                      {item}
                    </label>
                  </div>
                ))}
              </div>
              
              {allChecklistComplete && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Great! You're ready for your video consultation.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        {/* Technical Support */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">Having technical issues?</p>
            <p className="text-sm mt-1">
              Contact our support team at least 15 minutes before your appointment for assistance.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}