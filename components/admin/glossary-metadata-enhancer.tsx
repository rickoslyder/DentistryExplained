'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sparkles, ChevronDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { GlossaryMetadataDialog } from './glossary-metadata-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface GlossaryTerm {
  id: string
  term: string
  category: string | null
  difficulty: string | null
  pronunciation: string | null
  also_known_as: string[] | null
  related_terms: string[] | null
  example: string | null
}

interface GlossaryMetadataEnhancerProps {
  allTerms: GlossaryTerm[]
  termsWithMissingMetadata: number
}

export function GlossaryMetadataEnhancer({
  allTerms,
  termsWithMissingMetadata
}: GlossaryMetadataEnhancerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showSelectDialog, setShowSelectDialog] = useState(false)
  const [showFieldDialog, setShowFieldDialog] = useState(false)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [selectedTermIds, setSelectedTermIds] = useState<Set<string>>(new Set())
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set(['category', 'difficulty', 'pronunciation', 'also_known_as', 'related_terms', 'example']))
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [progressMessage, setProgressMessage] = useState('')
  const [progressData, setProgressData] = useState({
    currentBatch: 0,
    totalBatches: 0,
    processedTerms: 0,
    totalTerms: 0,
    currentTerm: ''
  })
  const [enhanceMode, setEnhanceMode] = useState<'all' | 'selected'>('all')

  // Get terms with missing metadata
  const termsNeedingMetadata = allTerms.filter(term => 
    !term.category || 
    !term.difficulty || 
    !term.pronunciation || 
    !term.also_known_as || 
    !term.related_terms || 
    !term.example
  )

  // Process enhancement with streaming for progress updates
  const processEnhancement = async (termIds: 'all' | string[], fields?: string[]) => {
    setIsLoading(true)
    setShowProgressDialog(true)
    setSuggestions([])
    
    try {
      const response = await fetch('/api/admin/glossary/enhance-metadata-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          term_ids: termIds,
          fields: fields || Array.from(selectedFields)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start enhancement')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              switch (data.type) {
                case 'connected':
                  setProgressMessage(data.message)
                  break
                
                case 'progress':
                  setProgressMessage(data.message)
                  if (data.totalTerms) {
                    setProgressData(prev => ({ ...prev, totalTerms: data.totalTerms }))
                  }
                  break
                
                case 'batch-start':
                  setProgressData(prev => ({
                    ...prev,
                    currentBatch: data.batchNumber,
                    totalBatches: data.totalBatches
                  }))
                  setProgressMessage(data.message)
                  break
                
                case 'term-processed':
                  setProgressData(prev => ({
                    ...prev,
                    processedTerms: prev.processedTerms + 1,
                    currentTerm: data.term
                  }))
                  break
                
                case 'batch-complete':
                  setProgressMessage(`Completed batch ${data.batchNumber}`)
                  break
                
                case 'batch-error':
                  console.error(`Batch ${data.batchNumber} failed:`, data.message)
                  setProgressMessage(`⚠️ Failed to process batch ${data.batchNumber}`)
                  // Don't throw here - allow other batches to continue
                  break
                
                case 'complete':
                  setSuggestions(data.suggestions)
                  setShowProgressDialog(false)
                  setShowReviewDialog(true)
                  if (data.suggestions.length === 0) {
                    toast.warning('No suggestions were generated. Check the console for errors.')
                  } else {
                    toast.success(`Generated suggestions for ${data.suggestions.length} terms`)
                  }
                  break
                
                case 'error':
                  throw new Error(data.message)
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error enhancing metadata:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to enhance metadata')
      setShowProgressDialog(false)
    } finally {
      setIsLoading(false)
      setProgressMessage('')
      setProgressData({
        currentBatch: 0,
        totalBatches: 0,
        processedTerms: 0,
        totalTerms: 0,
        currentTerm: ''
      })
    }
  }

  // Handle enhancing all terms with missing metadata
  const handleEnhanceAll = async () => {
    if (termsNeedingMetadata.length === 0) {
      toast.error('No terms with missing metadata')
      return
    }

    setEnhanceMode('all')
    setShowFieldDialog(true)
  }

  // Handle enhancing selected terms
  const handleEnhanceSelected = async () => {
    if (selectedTermIds.size === 0) {
      toast.error('No terms selected')
      return
    }

    setShowSelectDialog(false)
    setEnhanceMode('selected')
    setShowFieldDialog(true)
  }

  // Process enhancement after field selection
  const handleFieldsSelected = async () => {
    setShowFieldDialog(false)
    
    if (selectedFields.size === 0) {
      toast.error('No fields selected')
      return
    }

    if (enhanceMode === 'all') {
      await processEnhancement('all')
    } else {
      await processEnhancement(Array.from(selectedTermIds))
      setSelectedTermIds(new Set())
    }
  }

  // Apply accepted suggestions
  const handleApplySuggestions = async (accepted: Record<string, any>) => {
    const updates = Object.entries(accepted).map(([termId, fields]) => ({
      id: termId,
      ...fields
    }))

    try {
      // Update terms in Supabase
      const response = await fetch('/api/admin/glossary/update-metadata', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })

      if (!response.ok) {
        throw new Error('Failed to update metadata')
      }

      toast.success(`Updated metadata for ${updates.length} terms`)
      
      // Reload the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error applying suggestions:', error)
      toast.error('Failed to apply suggestions')
    }
  }

  // Toggle term selection
  const toggleTermSelection = (termId: string) => {
    const newSelection = new Set(selectedTermIds)
    if (newSelection.has(termId)) {
      newSelection.delete(termId)
    } else {
      newSelection.add(termId)
    }
    setSelectedTermIds(newSelection)
  }

  // Select all terms with missing metadata
  const selectAllMissing = () => {
    setSelectedTermIds(new Set(termsNeedingMetadata.map(t => t.id)))
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedTermIds(new Set())
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {progressMessage || 'Processing...'}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Enhance Metadata
                <ChevronDown className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Metadata Enhancement</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEnhanceAll}>
            <Sparkles className="h-4 w-4 mr-2" />
            Enhance All Missing ({termsWithMissingMetadata})
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowSelectDialog(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Select Terms to Enhance
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Field Selection Dialog */}
      <Dialog open={showFieldDialog} onOpenChange={setShowFieldDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Fields to Enhance</DialogTitle>
            <DialogDescription>
              Choose which metadata fields you want to generate with AI. Only fields that are currently empty will be filled.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-2">
              The AI will only generate suggestions for fields that are currently missing or empty in your selected terms.
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="check-all-fields"
                  checked={selectedFields.size === 6}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedFields(new Set(['category', 'difficulty', 'pronunciation', 'also_known_as', 'related_terms', 'example']))
                    } else {
                      setSelectedFields(new Set())
                    }
                  }}
                />
                <label htmlFor="check-all-fields" className="text-sm font-medium cursor-pointer">
                  Select All Fields
                </label>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                {[
                  { id: 'category', label: 'Category', description: 'Anatomical, procedural, condition, etc.' },
                  { id: 'difficulty', label: 'Difficulty Level', description: 'Basic or advanced terminology' },
                  { id: 'pronunciation', label: 'Pronunciation', description: 'Phonetic spelling for complex terms' },
                  { id: 'also_known_as', label: 'Also Known As', description: 'Alternative names or abbreviations' },
                  { id: 'related_terms', label: 'Related Terms', description: 'Connected glossary terms' },
                  { id: 'example', label: 'Example Usage', description: 'Contextual example sentence' }
                ].map(field => (
                  <div key={field.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={selectedFields.has(field.id)}
                      onCheckedChange={(checked) => {
                        const newFields = new Set(selectedFields)
                        if (checked) {
                          newFields.add(field.id)
                        } else {
                          newFields.delete(field.id)
                        }
                        setSelectedFields(newFields)
                      }}
                    />
                    <div className="flex-1">
                      <label htmlFor={field.id} className="text-sm font-medium cursor-pointer">
                        {field.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{field.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFieldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleFieldsSelected} disabled={selectedFields.size === 0}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Suggestions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Term Selection Dialog */}
      <Dialog open={showSelectDialog} onOpenChange={setShowSelectDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Select Terms to Enhance</DialogTitle>
            <DialogDescription>
              Choose which terms to enhance with AI-generated metadata.
              {selectedTermIds.size > 0 && (
                <span className="ml-2 text-primary font-medium">
                  {selectedTermIds.size} selected
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-3 border-b bg-muted/50">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAllMissing}
              >
                Select All Missing
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
              >
                Clear Selection
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: 'calc(80vh - 200px)' }}>
            <div className="space-y-2">
              {allTerms.map(term => {
                const missingFields = []
                if (!term.category) missingFields.push('category')
                if (!term.difficulty) missingFields.push('difficulty')
                if (!term.pronunciation) missingFields.push('pronunciation')
                if (!term.also_known_as) missingFields.push('aliases')
                if (!term.related_terms) missingFields.push('related')
                if (!term.example) missingFields.push('example')

                if (missingFields.length === 0) return null

                return (
                  <div
                    key={term.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleTermSelection(term.id)}
                  >
                    <Checkbox
                      checked={selectedTermIds.has(term.id)}
                      onCheckedChange={() => toggleTermSelection(term.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{term.term}</div>
                      <div className="flex gap-1 mt-1">
                        {missingFields.map(field => (
                          <Badge key={field} variant="outline" className="text-xs">
                            Missing: {field}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          <DialogFooter className="px-6 py-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSelectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEnhanceSelected}
              disabled={selectedTermIds.size === 0}
            >
              Enhance {selectedTermIds.size} Terms
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              Enhancing Metadata
            </DialogTitle>
            <DialogDescription>
              Using AI to generate metadata suggestions for your glossary terms.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {progressData.processedTerms} / {progressData.totalTerms} terms
                    </span>
                  </div>
                  <Progress 
                    value={(progressData.processedTerms / Math.max(progressData.totalTerms, 1)) * 100} 
                    className="h-2"
                  />
                </div>
                
                {progressData.totalBatches > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Batch</span>
                      <span className="font-medium">
                        {progressData.currentBatch} / {progressData.totalBatches}
                      </span>
                    </div>
                    <Progress 
                      value={(progressData.currentBatch / progressData.totalBatches) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
                
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">
                    {progressMessage}
                  </p>
                  {progressData.currentTerm && (
                    <p className="text-sm mt-1">
                      Processing: <span className="font-medium">{progressData.currentTerm}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>This may take a few minutes for large batches...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <GlossaryMetadataDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        suggestions={suggestions}
        onApply={handleApplySuggestions}
      />
    </>
  )
}