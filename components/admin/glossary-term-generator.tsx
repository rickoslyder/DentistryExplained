'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Sparkles, Loader2, Check, X, Edit2, Plus, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GeneratedTerm {
  term: string
  definition: string
  pronunciation: string | null
  also_known_as: string[] | null
  related_terms: string[] | null
  category: string
  difficulty: 'basic' | 'advanced'
  example: string | null
}

interface GenerationOptions {
  count: number
  category: string
  difficulty: string
}

export function GlossaryTermGenerator() {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTerms, setGeneratedTerms] = useState<GeneratedTerm[]>([])
  const [selectedTerms, setSelectedTerms] = useState<Set<number>>(new Set())
  const [options, setOptions] = useState<GenerationOptions>({
    count: 5,
    category: 'any',
    difficulty: 'mixed'
  })
  const [isSaving, setSaving] = useState(false)
  const router = useRouter()

  const categoryOptions = [
    { value: 'any', label: 'Any Category' },
    { value: 'anatomy', label: 'Anatomy' },
    { value: 'conditions', label: 'Conditions' },
    { value: 'procedures', label: 'Procedures' },
    { value: 'materials', label: 'Materials' },
    { value: 'orthodontics', label: 'Orthodontics' },
    { value: 'pediatric', label: 'Pediatric' },
    { value: 'costs', label: 'Costs & Insurance' },
    { value: 'prosthetics', label: 'Prosthetics' },
    { value: 'specialties', label: 'Specialties' }
  ]

  const generateTerms = async () => {
    setIsGenerating(true)
    setGeneratedTerms([])
    setSelectedTerms(new Set())

    try {
      const response = await fetch('/api/glossary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate terms')
      }

      const data = await response.json()
      setGeneratedTerms(data.terms)
      
      // Auto-select all terms
      setSelectedTerms(new Set(data.terms.map((_: any, i: number) => i)))
      
      toast.success(`Generated ${data.terms.length} unique terms`, {
        description: `Avoided ${data.metadata.existingTermsCount} existing terms`
      })
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate terms', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleTermSelection = (index: number) => {
    const newSelected = new Set(selectedTerms)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedTerms(newSelected)
  }

  const toggleAll = () => {
    if (selectedTerms.size === generatedTerms.length) {
      setSelectedTerms(new Set())
    } else {
      setSelectedTerms(new Set(generatedTerms.map((_, i) => i)))
    }
  }

  const saveSelectedTerms = async () => {
    if (selectedTerms.size === 0) {
      toast.error('No terms selected')
      return
    }

    setSaving(true)
    const termsToSave = Array.from(selectedTerms).map(i => generatedTerms[i])

    try {
      // Save each term
      const savePromises = termsToSave.map(term =>
        fetch('/api/admin/glossary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(term)
        })
      )

      const results = await Promise.allSettled(savePromises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        toast.success(`Added ${successful} terms to glossary`, {
          description: failed > 0 ? `${failed} terms failed to save` : undefined
        })
        
        // Refresh the page
        router.refresh()
        setIsOpen(false)
        setGeneratedTerms([])
        setSelectedTerms(new Set())
      } else {
        toast.error('Failed to save terms')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save terms')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Terms with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>AI Term Generator</DialogTitle>
          <DialogDescription>
            Generate new glossary terms using AI. Terms are checked against existing entries to avoid duplicates.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Generation Options */}
          {generatedTerms.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generation Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Terms</Label>
                    <RadioGroup 
                      value={options.count.toString()} 
                      onValueChange={(v) => setOptions({...options, count: parseInt(v)})}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="3" id="count-3" />
                        <Label htmlFor="count-3">3 terms</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="5" id="count-5" />
                        <Label htmlFor="count-5">5 terms</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="10" id="count-10" />
                        <Label htmlFor="count-10">10 terms</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={options.category} onValueChange={(v) => setOptions({...options, category: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <RadioGroup 
                      value={options.difficulty} 
                      onValueChange={(v) => setOptions({...options, difficulty: v})}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="mixed" id="diff-mixed" />
                        <Label htmlFor="diff-mixed">Mixed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="basic" id="diff-basic" />
                        <Label htmlFor="diff-basic">Basic only</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="advanced" id="diff-advanced" />
                        <Label htmlFor="diff-advanced">Advanced only</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <Button 
                  onClick={generateTerms} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Terms...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Terms
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Generated Terms */}
          {generatedTerms.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Generated Terms</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAll}
                    >
                      {selectedTerms.size === generatedTerms.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setGeneratedTerms([])
                        setSelectedTerms(new Set())
                      }}
                    >
                      Generate New
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Review and select terms to add to the glossary. {selectedTerms.size} of {generatedTerms.length} selected.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedTerms.size === generatedTerms.length}
                            onCheckedChange={() => toggleAll()}
                          />
                        </TableHead>
                        <TableHead>Term</TableHead>
                        <TableHead>Definition</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedTerms.map((term, index) => (
                        <TableRow key={index} className={selectedTerms.has(index) ? 'bg-muted/50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedTerms.has(index)}
                              onCheckedChange={() => toggleTermSelection(index)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {term.term}
                            {term.pronunciation && (
                              <p className="text-xs text-muted-foreground">{term.pronunciation}</p>
                            )}
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm line-clamp-2">{term.definition}</p>
                            {term.example && (
                              <p className="text-xs text-muted-foreground mt-1">Ex: {term.example}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{term.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={term.difficulty === 'basic' ? 'secondary' : 'default'}>
                              {term.difficulty}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              title="Edit functionality coming soon"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {selectedTerms.size > 0 && (
                  <div className="flex items-center justify-between mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Selected terms will be added to the glossary immediately.
                      </p>
                    </div>
                    <Button
                      onClick={saveSelectedTerms}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add {selectedTerms.size} Terms
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}