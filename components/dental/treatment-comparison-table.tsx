'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, X, Info, Filter } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export interface TreatmentOption {
  name: string
  description?: string
  duration: string
  cost: string
  successRate: string
  pros: string[]
  cons: string[]
  nhsAvailable: boolean
  recoveryTime?: string
  painLevel?: 'low' | 'medium' | 'high'
  maintenanceRequired?: boolean
}

interface TreatmentComparisonTableProps {
  title?: string
  description?: string
  treatments: TreatmentOption[]
  showFilters?: boolean
  className?: string
}

export function TreatmentComparisonTable({
  title = "Treatment Options Comparison",
  description,
  treatments,
  showFilters = true,
  className
}: TreatmentComparisonTableProps) {
  const [showNHSOnly, setShowNHSOnly] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  const filteredTreatments = showNHSOnly 
    ? treatments.filter(t => t.nhsAvailable)
    : treatments
    
  const toggleExpanded = (name: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(name)) {
      newExpanded.delete(name)
    } else {
      newExpanded.add(name)
    }
    setExpandedRows(newExpanded)
  }
  
  const getPainLevelBadge = (level?: 'low' | 'medium' | 'high') => {
    if (!level) return null
    
    const variants = {
      low: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', label: 'Low Pain' },
      medium: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', label: 'Moderate Pain' },
      high: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', label: 'High Pain' }
    }
    
    const variant = variants[level]
    return <Badge className={cn('text-xs', variant.color)}>{variant.label}</Badge>
  }
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {showFilters && treatments.some(t => t.nhsAvailable) && (
            <div className="flex items-center space-x-2">
              <Switch
                id="nhs-filter"
                checked={showNHSOnly}
                onCheckedChange={setShowNHSOnly}
              />
              <Label htmlFor="nhs-filter" className="text-sm cursor-pointer">
                NHS only
              </Label>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Treatment</TableHead>
                <TableHead className="min-w-[100px]">Duration</TableHead>
                <TableHead className="min-w-[120px]">Cost Range</TableHead>
                <TableHead className="min-w-[100px]">Success Rate</TableHead>
                <TableHead className="min-w-[100px] text-center">NHS</TableHead>
                <TableHead className="min-w-[120px]">Recovery</TableHead>
                <TableHead className="min-w-[100px]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTreatments.map((treatment) => (
                <>
                  <TableRow key={treatment.name} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="space-y-1">
                        <div>{treatment.name}</div>
                        {treatment.description && (
                          <div className="text-xs text-muted-foreground">{treatment.description}</div>
                        )}
                        <div className="flex gap-2">
                          {treatment.painLevel && getPainLevelBadge(treatment.painLevel)}
                          {treatment.maintenanceRequired && (
                            <Badge variant="outline" className="text-xs">Maintenance Required</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{treatment.duration}</TableCell>
                    <TableCell className="font-semibold">{treatment.cost}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{treatment.successRate}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {treatment.nhsAvailable ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </TableCell>
                    <TableCell>{treatment.recoveryTime || 'Varies'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(treatment.name)}
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(treatment.name) && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/30">
                        <div className="p-4 space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-green-700 dark:text-green-300 mb-2">Advantages</h4>
                              <ul className="space-y-1">
                                {treatment.pros.map((pro, index) => (
                                  <li key={index} className="flex items-start gap-2 text-sm">
                                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span>{pro}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold text-red-700 dark:text-red-300 mb-2">Disadvantages</h4>
                              <ul className="space-y-1">
                                {treatment.cons.map((con, index) => (
                                  <li key={index} className="flex items-start gap-2 text-sm">
                                    <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    <span>{con}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredTreatments.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No treatments match your filter criteria
          </div>
        )}
      </CardContent>
    </Card>
  )
}