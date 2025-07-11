'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2, Check, X, Sparkles, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetadataSuggestion {
  term_id: string
  term: string
  suggestions: {
    category: string | null
    difficulty: 'basic' | 'advanced' | null
    pronunciation: string | null
    also_known_as: string[] | null
    related_terms: string[] | null
    example: string | null
  }
}

interface GlossaryMetadataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  suggestions: MetadataSuggestion[]
  onApply: (accepted: Record<string, Partial<MetadataSuggestion['suggestions']>>) => Promise<void>
  isLoading?: boolean
}

export function GlossaryMetadataDialog({
  open,
  onOpenChange,
  suggestions,
  onApply,
  isLoading = false
}: GlossaryMetadataDialogProps) {
  const [acceptedFields, setAcceptedFields] = useState<Record<string, Set<string>>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Field labels
  const fieldLabels = {
    category: 'Category',
    difficulty: 'Difficulty',
    pronunciation: 'Pronunciation',
    also_known_as: 'Also Known As',
    related_terms: 'Related Terms',
    example: 'Example Usage'
  }

  // Toggle field acceptance
  const toggleFieldAcceptance = (termId: string, field: string) => {
    setAcceptedFields(prev => {
      const termFields = new Set(prev[termId] || [])
      if (termFields.has(field)) {
        termFields.delete(field)
      } else {
        termFields.add(field)
      }
      return { ...prev, [termId]: termFields }
    })
  }

  // Toggle all fields for a term
  const toggleAllFieldsForTerm = (termId: string) => {
    const allFields = Object.keys(fieldLabels)
    const currentFields = acceptedFields[termId] || new Set()
    
    if (currentFields.size === allFields.length) {
      // Uncheck all
      setAcceptedFields(prev => ({ ...prev, [termId]: new Set() }))
    } else {
      // Check all
      setAcceptedFields(prev => ({ ...prev, [termId]: new Set(allFields) }))
    }
  }

  // Accept/reject all suggestions
  const acceptAll = () => {
    const allAccepted: Record<string, Set<string>> = {}
    suggestions.forEach(s => {
      allAccepted[s.term_id] = new Set(Object.keys(fieldLabels))
    })
    setAcceptedFields(allAccepted)
  }

  const rejectAll = () => {
    setAcceptedFields({})
  }

  // Apply accepted changes
  const handleApply = async () => {
    const acceptedSuggestions: Record<string, Partial<MetadataSuggestion['suggestions']>> = {}
    
    suggestions.forEach(suggestion => {
      const fields = acceptedFields[suggestion.term_id]
      if (fields && fields.size > 0) {
        const accepted: Partial<MetadataSuggestion['suggestions']> = {}
        fields.forEach(field => {
          const value = suggestion.suggestions[field as keyof typeof suggestion.suggestions]
          if (value !== null) {
            (accepted as any)[field] = value
          }
        })
        acceptedSuggestions[suggestion.term_id] = accepted
      }
    })

    if (Object.keys(acceptedSuggestions).length === 0) {
      toast.error('No suggestions selected')
      return
    }

    setIsSaving(true)
    try {
      await onApply(acceptedSuggestions)
      onOpenChange(false)
      setAcceptedFields({})
    } catch (error) {
      console.error('Error applying suggestions:', error)
      toast.error('Failed to apply suggestions')
    } finally {
      setIsSaving(false)
    }
  }

  // Count accepted fields
  const acceptedCount = Object.values(acceptedFields).reduce((sum, fields) => sum + fields.size, 0)
  const totalFields = suggestions.length * Object.keys(fieldLabels).length

  // Format value for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A'
    if (Array.isArray(value)) return value.join(', ')
    return String(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Review Metadata Suggestions
          </DialogTitle>
          <DialogDescription>
            Review and accept AI-generated metadata suggestions for glossary terms.
            {acceptedCount > 0 && (
              <span className="ml-2 text-primary font-medium">
                {acceptedCount} of {totalFields} fields selected
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Select the suggestions you want to apply. Only selected fields will be updated.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={acceptAll}
              >
                <Check className="h-4 w-4 mr-1" />
                Accept All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
              >
                <X className="h-4 w-4 mr-1" />
                Reject All
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: 'calc(90vh - 250px)' }}>
          <div className="space-y-6">
            {suggestions.map((suggestion, index) => (
              <Card key={suggestion.term_id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{suggestion.term}</CardTitle>
                      <CardDescription>
                        Review suggested metadata fields
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAllFieldsForTerm(suggestion.term_id)}
                    >
                      {acceptedFields[suggestion.term_id]?.size === Object.keys(fieldLabels).length
                        ? 'Deselect All'
                        : 'Select All'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(fieldLabels).map(([field, label]) => {
                    const value = suggestion.suggestions[field as keyof typeof suggestion.suggestions]
                    const isAccepted = acceptedFields[suggestion.term_id]?.has(field) || false
                    
                    if (value === null) return null

                    return (
                      <div
                        key={field}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                          isAccepted ? "bg-primary/10 border-primary/30" : "bg-muted/30 hover:bg-muted/50"
                        )}
                        onClick={() => toggleFieldAcceptance(suggestion.term_id, field)}
                      >
                        <Checkbox
                          checked={isAccepted}
                          onCheckedChange={() => toggleFieldAcceptance(suggestion.term_id, field)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{label}</span>
                            {field === 'difficulty' && (
                              <Badge variant={value === 'basic' ? 'secondary' : 'default'}>
                                {value}
                              </Badge>
                            )}
                            {field === 'category' && (
                              <Badge variant="outline">{value}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatValue(value)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isSaving || acceptedCount === 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Apply {acceptedCount} Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}