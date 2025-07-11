'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Info } from 'lucide-react'

export type ToothCondition = 'healthy' | 'cavity' | 'filling' | 'crown' | 'missing' | 'implant' | 'root-canal'
export type NotationSystem = 'universal' | 'fdi' | 'palmer'

interface ToothData {
  id: number
  condition?: ToothCondition
  notes?: string
}

interface InteractiveToothChartProps {
  title?: string
  description?: string
  defaultNotation?: NotationSystem
  teeth?: ToothData[]
  onToothClick?: (toothId: number, condition?: ToothCondition) => void
  readOnly?: boolean
  showLegend?: boolean
  className?: string
}

const conditionColors: Record<ToothCondition, { bg: string; border: string; text: string }> = {
  healthy: { bg: 'bg-green-100 dark:bg-green-900', border: 'border-green-300', text: 'Healthy' },
  cavity: { bg: 'bg-red-100 dark:bg-red-900', border: 'border-red-300', text: 'Cavity' },
  filling: { bg: 'bg-blue-100 dark:bg-blue-900', border: 'border-blue-300', text: 'Filling' },
  crown: { bg: 'bg-purple-100 dark:bg-purple-900', border: 'border-purple-300', text: 'Crown' },
  missing: { bg: 'bg-gray-100 dark:bg-gray-800', border: 'border-gray-300', text: 'Missing' },
  implant: { bg: 'bg-indigo-100 dark:bg-indigo-900', border: 'border-indigo-300', text: 'Implant' },
  'root-canal': { bg: 'bg-orange-100 dark:bg-orange-900', border: 'border-orange-300', text: 'Root Canal' }
}

const toothNumbers = {
  universal: {
    upper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    lower: [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17]
  },
  fdi: {
    upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]
  },
  palmer: {
    upper: ['8R', '7R', '6R', '5R', '4R', '3R', '2R', '1R', '1L', '2L', '3L', '4L', '5L', '6L', '7L', '8L'],
    lower: ['8R', '7R', '6R', '5R', '4R', '3R', '2R', '1R', '1L', '2L', '3L', '4L', '5L', '6L', '7L', '8L']
  }
}

export function InteractiveToothChart({
  title = "Dental Chart",
  description,
  defaultNotation = 'universal',
  teeth = [],
  onToothClick,
  readOnly = false,
  showLegend = true,
  className
}: InteractiveToothChartProps) {
  const [notation, setNotation] = useState<NotationSystem>(defaultNotation)
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  
  const toothMap = new Map(teeth.map(t => [t.id, t]))
  
  const handleToothClick = (toothId: number) => {
    if (readOnly) return
    
    setSelectedTooth(toothId)
    const toothData = toothMap.get(toothId)
    onToothClick?.(toothId, toothData?.condition)
  }
  
  const getToothLabel = (position: 'upper' | 'lower', index: number): string | number => {
    return toothNumbers[notation][position][index]
  }
  
  const renderTooth = (toothId: number, label: string | number) => {
    const toothData = toothMap.get(toothId)
    const condition = toothData?.condition || 'healthy'
    const colors = conditionColors[condition]
    
    return (
      <TooltipProvider key={toothId}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleToothClick(toothId)}
              disabled={readOnly}
              className={cn(
                "relative w-10 h-12 rounded-lg border-2 transition-all duration-200",
                "flex items-center justify-center text-xs font-medium",
                colors.bg,
                colors.border,
                selectedTooth === toothId && "ring-2 ring-primary ring-offset-2",
                !readOnly && "hover:scale-110 cursor-pointer",
                readOnly && "cursor-default"
              )}
            >
              {condition === 'missing' ? '✕' : label}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-semibold">Tooth #{label}</p>
              <p className="text-sm">{colors.text}</p>
              {toothData?.notes && (
                <p className="text-xs text-muted-foreground">{toothData.notes}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <Tabs value={notation} onValueChange={(v) => setNotation(v as NotationSystem)}>
            <TabsList>
              <TabsTrigger value="universal">Universal</TabsTrigger>
              <TabsTrigger value="fdi">FDI</TabsTrigger>
              <TabsTrigger value="palmer">Palmer</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upper Teeth */}
        <div className="space-y-2">
          <div className="text-center text-sm font-medium text-muted-foreground">Upper Teeth (Maxillary)</div>
          <div className="grid grid-cols-8 gap-2 mx-auto max-w-md">
            {toothNumbers.universal.upper.map((toothId, index) => (
              renderTooth(toothId, getToothLabel('upper', index))
            ))}
          </div>
        </div>
        
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed" />
          </div>
          <div className="relative flex justify-center text-xs bg-background px-2">
            <span className="text-muted-foreground">Midline</span>
          </div>
        </div>
        
        {/* Lower Teeth */}
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-2 mx-auto max-w-md">
            {toothNumbers.universal.lower.map((toothId, index) => (
              renderTooth(toothId, getToothLabel('lower', index))
            ))}
          </div>
          <div className="text-center text-sm font-medium text-muted-foreground">Lower Teeth (Mandibular)</div>
        </div>
        
        {/* Legend */}
        {showLegend && (
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4" />
              <span className="text-sm font-medium">Condition Legend</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(conditionColors).map(([condition, colors]) => (
                <div key={condition} className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded border-2",
                    colors.bg,
                    colors.border
                  )} />
                  <span className="text-xs">{colors.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {selectedTooth && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Selected:</span> Tooth #{selectedTooth}
              {toothMap.get(selectedTooth)?.condition && (
                <Badge variant="outline" className="ml-2">
                  {conditionColors[toothMap.get(selectedTooth)!.condition!].text}
                </Badge>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}