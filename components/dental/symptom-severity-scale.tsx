'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SymptomSeverityScaleProps {
  title?: string
  description?: string
  showGuide?: boolean
  defaultValue?: number
  onChange?: (value: number) => void
  className?: string
}

const severityLevels = [
  { value: 1, label: 'Minimal', color: 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800', textColor: 'text-green-700 dark:text-green-300' },
  { value: 2, label: 'Mild', color: 'bg-green-200 hover:bg-green-300 dark:bg-green-800 dark:hover:bg-green-700', textColor: 'text-green-700 dark:text-green-300' },
  { value: 3, label: 'Mild-Moderate', color: 'bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800', textColor: 'text-yellow-700 dark:text-yellow-300' },
  { value: 4, label: 'Moderate', color: 'bg-yellow-200 hover:bg-yellow-300 dark:bg-yellow-800 dark:hover:bg-yellow-700', textColor: 'text-yellow-700 dark:text-yellow-300' },
  { value: 5, label: 'Moderate-Severe', color: 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800', textColor: 'text-orange-700 dark:text-orange-300' },
  { value: 6, label: 'Severe', color: 'bg-orange-200 hover:bg-orange-300 dark:bg-orange-800 dark:hover:bg-orange-700', textColor: 'text-orange-700 dark:text-orange-300' },
  { value: 7, label: 'Very Severe', color: 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800', textColor: 'text-red-700 dark:text-red-300' },
  { value: 8, label: 'Intense', color: 'bg-red-200 hover:bg-red-300 dark:bg-red-800 dark:hover:bg-red-700', textColor: 'text-red-700 dark:text-red-300' },
  { value: 9, label: 'Extreme', color: 'bg-red-300 hover:bg-red-400 dark:bg-red-700 dark:hover:bg-red-600', textColor: 'text-red-700 dark:text-red-300' },
  { value: 10, label: 'Unbearable', color: 'bg-red-400 hover:bg-red-500 dark:bg-red-600 dark:hover:bg-red-500', textColor: 'text-red-800 dark:text-red-200' }
]

const guidanceMessages = {
  low: {
    range: '1-3',
    message: 'Monitor symptoms. Book routine appointment if persistent.',
    icon: <Info className="w-4 h-4" />
  },
  medium: {
    range: '4-6',
    message: 'Consider booking appointment soon. Use over-the-counter pain relief as directed.',
    icon: <Info className="w-4 h-4" />
  },
  high: {
    range: '7-8',
    message: 'Book urgent appointment. Contact emergency dental services if needed.',
    icon: <AlertCircle className="w-4 h-4" />
  },
  critical: {
    range: '9-10',
    message: 'Seek immediate emergency dental care or call 111.',
    icon: <AlertCircle className="w-4 h-4" />
  }
}

export function SymptomSeverityScale({
  title = "Rate Your Pain/Discomfort",
  description = "Click on the scale to indicate your current level of pain or discomfort",
  showGuide = true,
  defaultValue = 0,
  onChange,
  className
}: SymptomSeverityScaleProps) {
  const [selectedValue, setSelectedValue] = useState(defaultValue)
  const [hoveredValue, setHoveredValue] = useState<number | null>(null)
  
  const handleSelect = (value: number) => {
    setSelectedValue(value)
    onChange?.(value)
  }
  
  const getGuidance = (value: number) => {
    if (value <= 3) return guidanceMessages.low
    if (value <= 6) return guidanceMessages.medium
    if (value <= 8) return guidanceMessages.high
    return guidanceMessages.critical
  }
  
  const currentGuidance = selectedValue > 0 ? getGuidance(selectedValue) : null
  const activeLevel = hoveredValue || selectedValue
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {severityLevels.map((level) => (
            <button
              key={level.value}
              onClick={() => handleSelect(level.value)}
              onMouseEnter={() => setHoveredValue(level.value)}
              onMouseLeave={() => setHoveredValue(null)}
              className={cn(
                "relative aspect-square rounded-lg border-2 transition-all duration-200",
                "flex flex-col items-center justify-center p-2",
                selectedValue === level.value ? 
                  "border-primary ring-2 ring-primary/20" : 
                  "border-transparent",
                level.color
              )}
              aria-label={`Pain level ${level.value}: ${level.label}`}
            >
              <span className={cn("text-lg font-bold", level.textColor)}>
                {level.value}
              </span>
              <span className={cn("text-xs hidden sm:block mt-1", level.textColor)}>
                {level.label}
              </span>
            </button>
          ))}
        </div>
        
        {activeLevel > 0 && (
          <div className="text-center space-y-2">
            <Badge variant="outline" className="text-lg px-4 py-1">
              Level {activeLevel}: {severityLevels[activeLevel - 1].label}
            </Badge>
          </div>
        )}
        
        {showGuide && currentGuidance && (
          <div className={cn(
            "p-4 rounded-lg border",
            selectedValue <= 3 && "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
            selectedValue > 3 && selectedValue <= 6 && "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
            selectedValue > 6 && selectedValue <= 8 && "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
            selectedValue > 8 && "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
          )}>
            <div className="flex items-start gap-3">
              {currentGuidance.icon}
              <div className="flex-1">
                <p className="font-medium">Level {currentGuidance.range} Guidance:</p>
                <p className="text-sm mt-1">{currentGuidance.message}</p>
              </div>
            </div>
          </div>
        )}
        
        {showGuide && (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium">When to seek help:</p>
            <ul className="space-y-1 ml-4">
              <li>• Levels 1-3: Non-urgent, monitor symptoms</li>
              <li>• Levels 4-6: Book appointment within a few days</li>
              <li>• Levels 7-8: Seek urgent dental care</li>
              <li>• Levels 9-10: Emergency - immediate care needed</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}