'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  Calendar,
  ChevronRight,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowRight,
  MapPin,
  Info
} from 'lucide-react'

export interface TimelineItem {
  id: string
  title: string
  description: string
  date?: string
  duration?: string
  type?: 'milestone' | 'step' | 'branch'
  status?: 'completed' | 'current' | 'upcoming' | 'optional'
  icon?: React.ReactNode
  branches?: TimelineBranch[]
}

export interface TimelineBranch {
  id: string
  condition: string
  items: TimelineItem[]
}

interface BranchingTimelineProps {
  items: TimelineItem[]
  title?: string
  description?: string
  currentStep?: string
  onStepClick?: (itemId: string) => void
  showDurations?: boolean
  className?: string
}

export function BranchingTimeline({ 
  items, 
  title = "Treatment Timeline",
  description,
  currentStep,
  onStepClick,
  showDurations = true,
  className 
}: BranchingTimelineProps) {
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'current':
        return <Circle className="h-5 w-5 text-blue-600 fill-blue-600" />
      case 'optional':
        return <Circle className="h-5 w-5 text-gray-400" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'current':
        return 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-400'
      case 'optional':
        return 'bg-gray-50 text-gray-600 border-gray-300 border-dashed'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300'
    }
  }

  const calculateTotalDuration = (items: TimelineItem[]): string => {
    let totalDays = 0
    items.forEach(item => {
      if (item.duration) {
        const match = item.duration.match(/(\d+)\s*(day|week|month)/i)
        if (match) {
          const value = parseInt(match[1])
          const unit = match[2].toLowerCase()
          if (unit === 'day') totalDays += value
          else if (unit === 'week') totalDays += value * 7
          else if (unit === 'month') totalDays += value * 30
        }
      }
    })
    
    if (totalDays === 0) return 'Duration varies'
    if (totalDays < 7) return `${totalDays} days`
    if (totalDays < 30) return `${Math.round(totalDays / 7)} weeks`
    return `${Math.round(totalDays / 30)} months`
  }

  const renderTimelineItem = (item: TimelineItem, index: number, isLast: boolean, isBranch: boolean = false) => {
    const isExpanded = expandedItems.has(item.id)
    const isClickable = onStepClick || item.branches
    const isCurrent = currentStep === item.id

    return (
      <div key={item.id} className={cn("relative", isBranch && "ml-8")}>
        {/* Connector Line */}
        {!isLast && (
          <div 
            className={cn(
              "absolute left-5 top-12 w-0.5 h-full",
              item.status === 'completed' ? "bg-green-300" : "bg-gray-300",
              item.type === 'branch' && "border-l-2 border-dashed border-gray-400"
            )} 
          />
        )}

        {/* Branch Indicator */}
        {item.type === 'branch' && (
          <div className="absolute -left-8 top-4">
            <GitBranch className="h-5 w-5 text-gray-400 rotate-90" />
          </div>
        )}

        {/* Timeline Item */}
        <div 
          className={cn(
            "flex gap-4 pb-8",
            isClickable && "cursor-pointer",
            "group"
          )}
          onClick={() => {
            if (item.branches) {
              toggleExpanded(item.id)
            } else if (onStepClick) {
              onStepClick(item.id)
            }
          }}
        >
          {/* Icon */}
          <div className="flex-shrink-0 z-10">
            {item.icon || getStatusIcon(item.status)}
          </div>

          {/* Content */}
          <div className="flex-1">
            <Card className={cn(
              "transition-all",
              getStatusColor(item.status),
              isClickable && "group-hover:shadow-md",
              isCurrent && "shadow-lg"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium flex items-center gap-2">
                      {item.title}
                      {item.type === 'milestone' && (
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      )}
                    </h4>
                    
                    <p className="text-sm mt-1 text-muted-foreground">
                      {item.description}
                    </p>

                    {/* Date and Duration */}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {item.date && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {item.date}
                        </Badge>
                      )}
                      {showDurations && item.duration && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.duration}
                        </Badge>
                      )}
                      {item.status === 'optional' && (
                        <Badge variant="outline" className="text-xs">
                          Optional
                        </Badge>
                      )}
                    </div>

                    {/* Branches */}
                    {item.branches && item.branches.length > 0 && (
                      <div className="mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0"
                        >
                          <GitBranch className="h-4 w-4 mr-1" />
                          {item.branches.length} possible path{item.branches.length > 1 ? 's' : ''}
                          <ChevronRight className={cn(
                            "h-4 w-4 ml-1 transition-transform",
                            isExpanded && "rotate-90"
                          )} />
                        </Button>
                      </div>
                    )}
                  </div>

                  {isClickable && !item.branches && (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Expanded Branches */}
            {isExpanded && item.branches && (
              <div className="mt-4 space-y-4">
                {item.branches.map((branch, branchIndex) => (
                  <div key={branch.id} className="ml-8">
                    <div className="mb-3">
                      <Badge className="mb-2">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {branch.condition}
                      </Badge>
                    </div>
                    <div className="relative">
                      {branch.items.map((branchItem, itemIndex) => 
                        renderTimelineItem(
                          branchItem, 
                          itemIndex, 
                          itemIndex === branch.items.length - 1,
                          true
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const totalDuration = calculateTotalDuration(items)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        
        {showDurations && (
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Estimated total duration: {totalDuration}
            </span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {items.map((item, index) => 
            renderTimelineItem(item, index, index === items.length - 1)
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-4 border-t">
          <p className="text-sm font-medium mb-3">Timeline Legend:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-blue-600 fill-blue-600" />
              <span>Current Step</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-gray-300" />
              <span>Upcoming</span>
            </div>
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 text-gray-400" />
              <span>Optional</span>
            </div>
          </div>
        </div>

        {/* Information */}
        {items.some(item => item.branches) && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">This timeline has decision points</p>
              <p className="text-sm mt-1">
                Click on steps with branch icons to explore different treatment paths based on your specific situation.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}