'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, X, Sparkles, RefreshCw } from 'lucide-react'

interface GlossaryTerm {
  id: string
  term: string
  definition: string
  category: string | null
  difficulty: string | null
  pronunciation: string | null
  also_known_as: string[] | null
  related_terms: string[] | null
  example: string | null
}

interface GlossaryTermEditorProps {
  term: GlossaryTerm
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function GlossaryTermEditor({
  term,
  open,
  onOpenChange,
  onUpdate
}: GlossaryTermEditorProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingExample, setIsGeneratingExample] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [formData, setFormData] = useState({
    term: term.term,
    definition: term.definition,
    category: term.category || '',
    difficulty: term.difficulty || '',
    pronunciation: term.pronunciation || '',
    also_known_as: term.also_known_as || [],
    related_terms: term.related_terms || [],
    example: term.example || ''
  })
  
  // Input states for array fields
  const [aliasInput, setAliasInput] = useState('')
  const [relatedInput, setRelatedInput] = useState('')

  const categories = [
    'anatomy',
    'conditions',
    'procedures',
    'materials',
    'orthodontics',
    'pediatric',
    'costs',
    'prosthetics',
    'specialties'
  ]

  const handleSubmit = async () => {
    if (!formData.term || !formData.definition) {
      toast.error('Term and definition are required')
      return
    }

    setIsLoading(true)
    try {
      const updateData: any = {
        term: formData.term,
        definition: formData.definition
      }

      // Only include fields if they have values
      if (formData.category) updateData.category = formData.category
      if (formData.difficulty) updateData.difficulty = formData.difficulty
      if (formData.pronunciation) updateData.pronunciation = formData.pronunciation
      if (formData.also_known_as.length > 0) updateData.also_known_as = formData.also_known_as
      if (formData.related_terms.length > 0) updateData.related_terms = formData.related_terms
      if (formData.example) updateData.example = formData.example

      const response = await fetch(`/api/admin/glossary/${term.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update term')
      }

      toast.success('Term updated successfully')
      onOpenChange(false)
      onUpdate()
    } catch (error) {
      console.error('Error updating term:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update term')
    } finally {
      setIsLoading(false)
    }
  }

  const addAlias = () => {
    if (aliasInput.trim()) {
      setFormData(prev => ({
        ...prev,
        also_known_as: [...prev.also_known_as, aliasInput.trim()]
      }))
      setAliasInput('')
    }
  }

  const removeAlias = (index: number) => {
    setFormData(prev => ({
      ...prev,
      also_known_as: prev.also_known_as.filter((_, i) => i !== index)
    }))
  }

  const addRelated = () => {
    if (relatedInput.trim()) {
      setFormData(prev => ({
        ...prev,
        related_terms: [...prev.related_terms, relatedInput.trim()]
      }))
      setRelatedInput('')
    }
  }

  const removeRelated = (index: number) => {
    setFormData(prev => ({
      ...prev,
      related_terms: prev.related_terms.filter((_, i) => i !== index)
    }))
  }

  const generateExample = async (withFeedback = false) => {
    if (!formData.term || !formData.definition) {
      toast.error('Please enter a term and definition first')
      return
    }

    setIsGeneratingExample(true)
    try {
      const requestData: any = {
        term: formData.term,
        definition: formData.definition,
        difficulty: formData.difficulty || null
      }

      if (withFeedback && feedback.trim()) {
        requestData.previousExample = formData.example
        requestData.feedback = feedback.trim()
      }

      const response = await fetch('/api/admin/glossary/generate-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate example')
      }

      const { example } = await response.json()
      setFormData(prev => ({ ...prev, example }))
      toast.success('Example generated successfully')
      
      // Reset feedback state after successful generation
      setShowFeedback(false)
      setFeedback('')
    } catch (error) {
      console.error('Error generating example:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate example')
    } finally {
      setIsGeneratingExample(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Glossary Term</DialogTitle>
          <DialogDescription>
            Update the term information and metadata
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="term">Term *</Label>
            <Input
              id="term"
              value={formData.term}
              onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value }))}
              placeholder="e.g., Dental caries"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="definition">Definition *</Label>
            <Textarea
              id="definition"
              value={formData.definition}
              onChange={(e) => setFormData(prev => ({ ...prev, definition: e.target.value }))}
              placeholder="Clear explanation of the term..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value === "none" ? '' : value }))}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value === "none" ? '' : value }))}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pronunciation">Pronunciation</Label>
            <Input
              id="pronunciation"
              value={formData.pronunciation}
              onChange={(e) => setFormData(prev => ({ ...prev, pronunciation: e.target.value }))}
              placeholder="e.g., den-tal CARE-eez"
            />
          </div>

          <div className="space-y-2">
            <Label>Also Known As</Label>
            <div className="flex gap-2">
              <Input
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                placeholder="Add alternative name..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAlias())}
              />
              <Button type="button" onClick={addAlias} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.also_known_as.map((alias, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {alias}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeAlias(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Related Terms</Label>
            <div className="flex gap-2">
              <Input
                value={relatedInput}
                onChange={(e) => setRelatedInput(e.target.value)}
                placeholder="Add related term..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRelated())}
              />
              <Button type="button" onClick={addRelated} variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.related_terms.map((related, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {related}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeRelated(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="example">Example Usage</Label>
              <div className="flex gap-2">
                {formData.example && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFeedback(!showFeedback)}
                    className="h-8"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateExample(false)}
                  disabled={isGeneratingExample || !formData.term || !formData.definition}
                  className="h-8"
                >
                  {isGeneratingExample ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Textarea
              id="example"
              value={formData.example}
              onChange={(e) => setFormData(prev => ({ ...prev, example: e.target.value }))}
              placeholder="Example sentence using the term..."
              rows={2}
            />
            {showFeedback && (
              <div className="mt-2 space-y-2 p-3 bg-muted rounded-md">
                <Label htmlFor="feedback" className="text-sm">Feedback for regeneration</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="E.g., Make it more clinical, add NHS context, simplify language..."
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => generateExample(true)}
                    disabled={isGeneratingExample || !feedback.trim()}
                  >
                    {isGeneratingExample ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      'Regenerate with Feedback'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowFeedback(false)
                      setFeedback('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Term'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}