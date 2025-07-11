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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, BookOpen, Calendar, Users, Building, Tag, Copy, FileText } from 'lucide-react'
import { formatCitation, citationFormats, type MedicalReference, type CitationFormat } from '@/lib/doi-validator'

interface ReferenceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  references: MedicalReference[]
  onInsert: (citation: string) => void
}

export function ReferenceDialog({
  open,
  onOpenChange,
  references,
  onInsert
}: ReferenceDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<CitationFormat>('apa')
  const [selectedRef, setSelectedRef] = useState<MedicalReference | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Get unique tags
  const allTags = Array.from(
    new Set(references.flatMap(ref => ref.tags || []))
  ).sort()

  // Filter references
  const filteredReferences = references.filter(ref => {
    const matchesSearch = searchTerm === '' || 
      ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ref.journal.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => ref.tags?.includes(tag))
    
    return matchesSearch && matchesTags
  })

  // Group by year
  const referencesByYear = filteredReferences.reduce((acc, ref) => {
    const year = ref.year.toString()
    if (!acc[year]) acc[year] = []
    acc[year].push(ref)
    return acc
  }, {} as Record<string, MedicalReference[]>)

  const handleInsert = () => {
    if (!selectedRef) {
      toast.error('Please select a reference')
      return
    }

    const citation = formatCitation(selectedRef, selectedFormat)
    onInsert(citation)
    onOpenChange(false)
    toast.success('Citation inserted')
    
    // Reset state
    setSelectedRef(null)
    setSearchTerm('')
  }

  const handleCopy = () => {
    if (!selectedRef) {
      toast.error('Please select a reference')
      return
    }

    const citation = formatCitation(selectedRef, selectedFormat)
    navigator.clipboard.writeText(citation)
    toast.success('Citation copied to clipboard')
  }

  const getCitationPreview = () => {
    if (!selectedRef) return 'Select a reference to preview citation'
    return formatCitation(selectedRef, selectedFormat)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert Citation</DialogTitle>
          <DialogDescription>
            Search and select a reference to insert its citation
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4">
          {/* Search and Format Selection */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search references..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={selectedFormat}
              onValueChange={(value) => setSelectedFormat(value as CitationFormat)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {citationFormats.map(format => (
                  <SelectItem key={format} value={format}>
                    {format.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filter:</span>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter(t => t !== tag))
                    } else {
                      setSelectedTags([...selectedTags, tag])
                    }
                  }}
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                >
                  Clear
                </Button>
              )}
            </div>
          )}

          <Tabs defaultValue="list" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">References ({filteredReferences.length})</TabsTrigger>
              <TabsTrigger value="preview">Citation Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="flex-1 mt-4">
              {filteredReferences.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                  <p>No references found</p>
                  <p className="text-sm mt-2">Try adjusting your search or filters</p>
                </div>
              ) : (
                <ScrollArea className="h-[350px] pr-4">
                  {Object.entries(referencesByYear)
                    .sort(([a], [b]) => Number(b) - Number(a))
                    .map(([year, yearRefs]) => (
                      <div key={year} className="mb-4">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                          {year}
                        </h3>
                        <div className="space-y-2">
                          {yearRefs.map(ref => (
                            <div
                              key={ref.id}
                              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                selectedRef?.id === ref.id
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:bg-muted/50'
                              }`}
                              onClick={() => setSelectedRef(ref)}
                            >
                              <h4 className="font-medium text-sm line-clamp-2 mb-1">
                                {ref.title}
                              </h4>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {ref.authors[0]}
                                  {ref.authors.length > 1 && ' et al.'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {ref.journal}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {ref.year}
                                </span>
                              </div>
                              {ref.tags && ref.tags.length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  {ref.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </ScrollArea>
              )}
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 mt-4">
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-muted/30">
                  <Label className="text-sm font-medium mb-2 block">
                    {selectedFormat.toUpperCase()} Format
                  </Label>
                  <p className="text-sm font-mono whitespace-pre-wrap">
                    {getCitationPreview()}
                  </p>
                </div>
                
                {selectedRef && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Reference Details</h4>
                    <div className="text-sm space-y-1 text-muted-foreground">
                      <p><strong>DOI:</strong> {selectedRef.doi}</p>
                      {selectedRef.pmid && <p><strong>PMID:</strong> {selectedRef.pmid}</p>}
                      <p><strong>Authors:</strong> {selectedRef.authors.join(', ')}</p>
                      <p><strong>Journal:</strong> {selectedRef.journal}</p>
                      <p><strong>Year:</strong> {selectedRef.year}</p>
                      {selectedRef.volume && <p><strong>Volume:</strong> {selectedRef.volume}</p>}
                      {selectedRef.issue && <p><strong>Issue:</strong> {selectedRef.issue}</p>}
                      {selectedRef.pages && <p><strong>Pages:</strong> {selectedRef.pages}</p>}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCopy}
            disabled={!selectedRef}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Citation
          </Button>
          <Button
            onClick={handleInsert}
            disabled={!selectedRef}
          >
            <FileText className="w-4 h-4 mr-2" />
            Insert Citation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}