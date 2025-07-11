'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { 
  Pill, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Info,
  Printer,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export interface MedicationInfo {
  name: string
  genericName?: string
  dosage: string
  frequency: string
  duration: string
  withFood?: boolean
  sideEffects?: string[]
  warnings?: string[]
  interactions?: string[]
  instructions?: string[]
  prescribedFor?: string
}

interface MedicationCardProps {
  medication: MedicationInfo
  className?: string
  printable?: boolean
}

export function MedicationCard({ medication, className, printable = true }: MedicationCardProps) {
  const [expanded, setExpanded] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  return (
    <Card className={cn("w-full print:shadow-none", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-xl">{medication.name}</CardTitle>
              {medication.genericName && (
                <CardDescription>Generic: {medication.genericName}</CardDescription>
              )}
            </div>
          </div>
          {printable && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrint}
              className="print:hidden"
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Primary Information */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Dosage</p>
              <p className="font-medium">{medication.dosage}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Frequency</p>
              <p className="font-medium">{medication.frequency}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{medication.duration}</p>
            </div>
          </div>
        </div>

        {medication.withFood !== undefined && (
          <Badge variant={medication.withFood ? "default" : "secondary"}>
            {medication.withFood ? "Take with food" : "Take on empty stomach"}
          </Badge>
        )}

        {medication.prescribedFor && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">Prescribed for:</p>
            <p className="text-sm">{medication.prescribedFor}</p>
          </div>
        )}

        <Separator />

        {/* Warnings - Always visible */}
        {medication.warnings && medication.warnings.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Important Warnings:</p>
              <ul className="list-disc list-inside space-y-1">
                {medication.warnings.map((warning, index) => (
                  <li key={index} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Expandable Section */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setExpanded(!expanded)}
          >
            <span>View detailed information</span>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {expanded && (
            <div className="space-y-4 animate-in slide-in-from-top-2">
              {/* Instructions */}
              {medication.instructions && medication.instructions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Instructions
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {medication.instructions.map((instruction, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {instruction}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Side Effects */}
              {medication.sideEffects && medication.sideEffects.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Possible Side Effects</h4>
                  <div className="flex flex-wrap gap-2">
                    {medication.sideEffects.map((effect, index) => (
                      <Badge key={index} variant="outline">
                        {effect}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Drug Interactions */}
              {medication.interactions && medication.interactions.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Drug Interactions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {medication.interactions.map((interaction, index) => (
                        <li key={index} className="text-sm">{interaction}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Print-only footer */}
        <div className="hidden print:block mt-6 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            This medication information was provided by your dental practice. 
            Always follow your dentist's instructions and contact them if you have any questions.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}