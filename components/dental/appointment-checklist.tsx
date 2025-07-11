'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle2, 
  Circle, 
  Printer, 
  RotateCcw,
  Calendar,
  Clock,
  FileText,
  AlertCircle
} from 'lucide-react'

export interface ChecklistItem {
  id: string
  text: string
  category?: 'before' | 'during' | 'after'
  priority?: 'high' | 'medium' | 'low'
  timeframe?: string
  details?: string
}

interface AppointmentChecklistProps {
  title?: string
  appointmentType?: string
  appointmentDate?: string
  items: ChecklistItem[]
  storageKey?: string
  className?: string
  printable?: boolean
}

export function AppointmentChecklist({ 
  title = "Appointment Checklist",
  appointmentType,
  appointmentDate,
  items,
  storageKey = 'appointment-checklist',
  className,
  printable = true
}: AppointmentChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Load saved state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setCheckedItems(new Set(parsed.items))
          setLastUpdated(new Date(parsed.lastUpdated))
        } catch (e) {
          console.error('Failed to load checklist state:', e)
        }
      }
    }
  }, [storageKey])

  // Save state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && checkedItems.size > 0) {
      localStorage.setItem(storageKey, JSON.stringify({
        items: Array.from(checkedItems),
        lastUpdated: new Date().toISOString()
      }))
      setLastUpdated(new Date())
    }
  }, [checkedItems, storageKey])

  const handleToggle = (itemId: string) => {
    const newCheckedItems = new Set(checkedItems)
    if (newCheckedItems.has(itemId)) {
      newCheckedItems.delete(itemId)
    } else {
      newCheckedItems.add(itemId)
    }
    setCheckedItems(newCheckedItems)
  }

  const handleReset = () => {
    setCheckedItems(new Set())
    localStorage.removeItem(storageKey)
    setLastUpdated(null)
  }

  const handlePrint = () => {
    window.print()
  }

  const progress = (checkedItems.size / items.length) * 100

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'general'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  const categoryTitles = {
    before: 'Before Your Appointment',
    during: 'Day of Appointment',
    after: 'After Your Appointment',
    general: 'General Instructions'
  }

  const categoryIcons = {
    before: Calendar,
    during: Clock,
    after: FileText,
    general: AlertCircle
  }

  const priorityColors = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600'
  }

  return (
    <Card className={cn("w-full print:shadow-none", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <div className="space-y-1 mt-2">
              {appointmentType && (
                <CardDescription>Procedure: {appointmentType}</CardDescription>
              )}
              {appointmentDate && (
                <CardDescription>Date: {appointmentDate}</CardDescription>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 print:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={handleReset}
              disabled={checkedItems.size === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            {printable && (
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2 print:hidden">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{checkedItems.size} of {items.length} completed</span>
          </div>
          <Progress value={progress} className="h-2" />
          {progress === 100 && (
            <p className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              All tasks completed!
            </p>
          )}
        </div>

        {/* Checklist Items by Category */}
        {Object.entries(groupedItems).map(([category, categoryItems]) => {
          const Icon = categoryIcons[category as keyof typeof categoryIcons] || AlertCircle
          
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">
                  {categoryTitles[category as keyof typeof categoryTitles] || category}
                </h3>
              </div>
              
              <div className="space-y-2 ml-7">
                {categoryItems.map((item) => (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={item.id}
                        checked={checkedItems.has(item.id)}
                        onCheckedChange={() => handleToggle(item.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 space-y-1">
                        <label
                          htmlFor={item.id}
                          className={cn(
                            "text-sm leading-relaxed cursor-pointer",
                            checkedItems.has(item.id) && "line-through text-muted-foreground"
                          )}
                        >
                          {item.text}
                          {item.priority && (
                            <Circle 
                              className={cn(
                                "inline-block h-2 w-2 ml-2",
                                priorityColors[item.priority]
                              )} 
                              fill="currentColor"
                            />
                          )}
                        </label>
                        
                        {item.timeframe && (
                          <Badge variant="outline" className="text-xs">
                            {item.timeframe}
                          </Badge>
                        )}
                        
                        {item.details && (
                          <p className="text-xs text-muted-foreground">
                            {item.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {category !== Object.keys(groupedItems)[Object.keys(groupedItems).length - 1] && (
                <Separator className="mt-4" />
              )}
            </div>
          )
        })}

        {/* Last Updated */}
        {lastUpdated && (
          <p className="text-xs text-muted-foreground text-center print:hidden">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}

        {/* Print Footer */}
        <div className="hidden print:block mt-6 pt-4 border-t">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              This checklist was provided by your dental practice. 
              Please bring this completed form to your appointment.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs font-medium">Patient Signature:</p>
                <div className="border-b border-gray-300 mt-4"></div>
              </div>
              <div>
                <p className="text-xs font-medium">Date:</p>
                <div className="border-b border-gray-300 mt-4"></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}