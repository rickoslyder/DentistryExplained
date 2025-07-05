"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Play, Pause, RotateCcw, AlertTriangle, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmergencyLogger } from '@/lib/emergency-audit'

interface CountdownTimerProps {
  emergencyType: 'knocked-out-tooth' | 'severe-bleeding' | 'custom'
  initialMinutes?: number
  criticalMinutes?: number
  onComplete?: () => void
  className?: string
}

interface TimeWindow {
  start: number
  end: number
  label: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
}

const emergencyTimeWindows: Record<string, TimeWindow[]> = {
  'knocked-out-tooth': [
    {
      start: 0,
      end: 30,
      label: 'Critical Window',
      severity: 'critical',
      message: 'Best chance of saving the tooth - seek immediate dental care!'
    },
    {
      start: 30,
      end: 60,
      label: 'Decreasing Success',
      severity: 'high',
      message: 'Success rate dropping - get to a dentist urgently!'
    },
    {
      start: 60,
      end: 120,
      label: 'Low Success Rate',
      severity: 'medium',
      message: 'Very low chance of saving tooth - still seek care'
    },
    {
      start: 120,
      end: Infinity,
      label: 'Unlikely to Save',
      severity: 'low',
      message: 'Tooth likely cannot be saved, but seek care for other treatment'
    }
  ],
  'severe-bleeding': [
    {
      start: 0,
      end: 20,
      label: 'Apply Pressure',
      severity: 'critical',
      message: 'Apply firm, continuous pressure with gauze'
    },
    {
      start: 20,
      end: 40,
      label: 'Continue Pressure',
      severity: 'high',
      message: 'Keep applying pressure - do not check or rinse'
    },
    {
      start: 40,
      end: 60,
      label: 'Seek Help',
      severity: 'critical',
      message: 'If still bleeding heavily, seek emergency care immediately'
    }
  ]
}

export function EmergencyCountdownTimer({ 
  emergencyType,
  initialMinutes = 30,
  criticalMinutes = 15,
  onComplete,
  className
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialMinutes * 60) // in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const totalTime = initialMinutes * 60
  const criticalTime = criticalMinutes * 60
  const minutesElapsed = Math.floor((totalTime - timeRemaining) / 60)

  // Get current time window
  const timeWindows = emergencyTimeWindows[emergencyType] || []
  const currentWindow = timeWindows.find(
    window => minutesElapsed >= window.start && minutesElapsed < window.end
  ) || timeWindows[timeWindows.length - 1]

  const playAlert = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return
    
    // Create a beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800 // Frequency in Hz
    gainNode.gain.value = 0.3 // Volume
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.2) // 200ms beep
  }, [soundEnabled])

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1
          
          // Play alerts at specific intervals
          if (newTime === criticalTime || newTime === 600 || newTime === 300) {
            playAlert()
          }
          
          if (newTime <= 0) {
            setIsRunning(false)
            if (onComplete) onComplete()
            EmergencyLogger.guidanceViewed('countdown-complete', emergencyType)
          }
          
          return Math.max(0, newTime)
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeRemaining, criticalTime, playAlert, onComplete, emergencyType])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsRunning(true)
    setHasStarted(true)
    EmergencyLogger.guidanceViewed('countdown-started', emergencyType)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeRemaining(totalTime)
    setHasStarted(false)
  }

  const progress = ((totalTime - timeRemaining) / totalTime) * 100
  const isCritical = timeRemaining <= criticalTime

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      isCritical && "border-red-500 shadow-lg shadow-red-200",
      currentWindow?.severity === 'critical' && isRunning && "animate-pulse",
      className
    )}>
      <CardHeader className={cn(
        "pb-3",
        currentWindow?.severity === 'critical' && "bg-red-50",
        currentWindow?.severity === 'high' && "bg-orange-50",
        currentWindow?.severity === 'medium' && "bg-yellow-50"
      )}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className={cn(
              "h-5 w-5",
              currentWindow?.severity === 'critical' && "text-red-600 animate-pulse",
              currentWindow?.severity === 'high' && "text-orange-600",
              currentWindow?.severity === 'medium' && "text-yellow-600"
            )} />
            Emergency Timer
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-8 w-8 p-0"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className={cn(
            "text-6xl font-mono font-bold tabular-nums",
            isCritical && "text-red-600",
            !isCritical && timeRemaining <= totalTime / 2 && "text-orange-600",
            !isCritical && timeRemaining > totalTime / 2 && "text-green-600"
          )}>
            {formatTime(timeRemaining)}
          </div>
          
          {currentWindow && (
            <div className="mt-2">
              <p className={cn(
                "font-semibold",
                currentWindow.severity === 'critical' && "text-red-700",
                currentWindow.severity === 'high' && "text-orange-700",
                currentWindow.severity === 'medium' && "text-yellow-700"
              )}>
                {currentWindow.label}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {currentWindow.message}
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress 
            value={progress} 
            className={cn(
              "h-3 transition-all duration-300",
              currentWindow?.severity === 'critical' && "[&>div]:bg-red-600",
              currentWindow?.severity === 'high' && "[&>div]:bg-orange-600",
              currentWindow?.severity === 'medium' && "[&>div]:bg-yellow-600",
              currentWindow?.severity === 'low' && "[&>div]:bg-gray-600"
            )}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 min</span>
            <span>{Math.floor(minutesElapsed)} min elapsed</span>
            <span>{initialMinutes} min</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 justify-center">
          {!hasStarted ? (
            <Button
              size="lg"
              onClick={handleStart}
              className="w-full max-w-xs bg-red-600 hover:bg-red-700"
            >
              <Play className="mr-2 h-5 w-5" />
              Start Emergency Timer
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                variant={isRunning ? "secondary" : "default"}
                onClick={isRunning ? handlePause : handleStart}
                disabled={timeRemaining === 0}
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Resume
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleReset}
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </>
          )}
        </div>

        {/* Time Windows Guide */}
        {timeWindows.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-sm mb-3">Time Windows</h4>
            <div className="space-y-2">
              {timeWindows.map((window, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-center justify-between text-sm p-2 rounded",
                    minutesElapsed >= window.start && minutesElapsed < window.end && "bg-gray-100 font-medium"
                  )}
                >
                  <span>
                    {window.start}-{window.end === Infinity ? '∞' : window.end} min
                  </span>
                  <span className={cn(
                    "text-xs px-2 py-1 rounded",
                    window.severity === 'critical' && "bg-red-100 text-red-700",
                    window.severity === 'high' && "bg-orange-100 text-orange-700",
                    window.severity === 'medium' && "bg-yellow-100 text-yellow-700",
                    window.severity === 'low' && "bg-gray-100 text-gray-700"
                  )}>
                    {window.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Alert */}
        {isCritical && isRunning && (
          <Alert className="mt-4 border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700 font-medium">
              Time is critical! Seek immediate dental care now!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}