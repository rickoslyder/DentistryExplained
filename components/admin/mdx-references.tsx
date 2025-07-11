'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  BookOpen,
  Copy,
  ExternalLink,
  FileText,
  Hash,
  Loader2,
  Plus,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle,
  Download,
  Tag,
  Calendar,
  Users,
  Building,
} from 'lucide-react'
import {
  validateDOI,
  fetchDOIMetadata,
  fetchPubMedMetadata,
  formatCitation,
  generateBibTeX,
  citationFormats,
  type MedicalReference,
  type CitationFormat,
} from '@/lib/doi-validator'

interface MDXReferencesProps {
  references: MedicalReference[]
  onReferencesChange: (references: MedicalReference[]) => void
  onInsertCitation?: (reference: MedicalReference, format: CitationFormat) => void
}

export function MDXReferences({ 
  references, 
  onReferencesChange,
  onInsertCitation 
}: MDXReferencesProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [doiInput, setDoiInput] = useState('')
  const [pmidInput, setPmidInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<CitationFormat>('apa')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Get unique tags from all references
  const allTags = Array.from(
    new Set(references.flatMap(ref => ref.tags || []))
  ).sort()

  // Filter references based on search and tags
  const filteredReferences = references.filter(ref => {
    const matchesSearch = searchTerm === '' || 
      ref.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ref.journal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ref.doi.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => ref.tags?.includes(tag))
    
    return matchesSearch && matchesTags
  })

  // Group references by year
  const referencesByYear = filteredReferences.reduce((acc, ref) => {
    const year = ref.year.toString()
    if (!acc[year]) acc[year] = []
    acc[year].push(ref)
    return acc
  }, {} as Record<string, MedicalReference[]>)

  const handleAddDOI = async () => {
    if (!doiInput.trim()) {
      toast.error('Please enter a DOI')
      return
    }

    if (!validateDOI(doiInput)) {
      toast.error('Invalid DOI format')
      return
    }

    setIsLoading(true)
    try {
      const metadata = await fetchDOIMetadata(doiInput)
      if (metadata) {
        // Add tags if any were entered
        if (tagInput.trim()) {
          metadata.tags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean)
        }
        
        // Check for duplicates
        if (references.some(ref => ref.doi === metadata.doi)) {
          toast.error('This reference already exists')
          return
        }
        
        onReferencesChange([...references, metadata])
        toast.success('Reference added successfully')
        setIsAddDialogOpen(false)
        setDoiInput('')
        setTagInput('')
      } else {
        toast.error('Could not fetch DOI metadata')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add reference')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPMID = async () => {
    if (!pmidInput.trim()) {
      toast.error('Please enter a PMID')
      return
    }

    setIsLoading(true)
    try {
      const metadata = await fetchPubMedMetadata(pmidInput)
      if (metadata) {
        // Add tags if any were entered
        if (tagInput.trim()) {
          metadata.tags = tagInput.split(',').map(tag => tag.trim()).filter(Boolean)
        }
        
        // Check for duplicates
        if (references.some(ref => ref.pmid === metadata.pmid)) {
          toast.error('This reference already exists')
          return
        }
        
        onReferencesChange([...references, metadata])
        toast.success('Reference added successfully')
        setIsAddDialogOpen(false)
        setPmidInput('')
        setTagInput('')
      } else {
        toast.error('Could not fetch PubMed metadata')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add reference')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveReference = (id: string) => {
    onReferencesChange(references.filter(ref => ref.id !== id))
    toast.success('Reference removed')
  }

  const handleCopyCitation = (ref: MedicalReference) => {
    const citation = formatCitation(ref, selectedFormat)
    navigator.clipboard.writeText(citation)
    toast.success(`${selectedFormat.toUpperCase()} citation copied to clipboard`)
  }

  const handleCopyBibTeX = (ref: MedicalReference) => {
    const bibtex = generateBibTeX(ref)
    navigator.clipboard.writeText(bibtex)
    toast.success('BibTeX entry copied to clipboard')
  }

  const handleInsertCitation = (ref: MedicalReference) => {
    if (onInsertCitation) {
      onInsertCitation(ref, selectedFormat)
      toast.success('Citation inserted into editor')
    }
  }

  const handleExportAll = () => {
    const bibtex = references.map(ref => generateBibTeX(ref)).join('\n\n')
    const blob = new Blob([bibtex], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'references.bib'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('References exported as BibTeX')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Medical References</CardTitle>
            <CardDescription>
              Manage and cite medical literature references
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAll}
              disabled={references.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export BibTeX
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Reference
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Medical Reference</DialogTitle>
                  <DialogDescription>
                    Enter a DOI or PubMed ID to automatically fetch reference metadata
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="doi" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="doi">DOI</TabsTrigger>
                    <TabsTrigger value="pmid">PubMed ID</TabsTrigger>
                  </TabsList>
                  <TabsContent value="doi" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="doi">Digital Object Identifier (DOI)</Label>
                      <Input
                        id="doi"
                        placeholder="10.1234/example.doi"
                        value={doiInput}
                        onChange={(e) => setDoiInput(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Example: 10.1038/sj.bdj.2018.1049
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags-doi">Tags (optional)</Label>
                      <Input
                        id="tags-doi"
                        placeholder="orthodontics, clinical-trial, pediatric"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated tags for organization
                      </p>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleAddDOI}
                        disabled={isLoading || !doiInput.trim()}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          'Add Reference'
                        )}
                      </Button>
                    </DialogFooter>
                  </TabsContent>
                  <TabsContent value="pmid" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pmid">PubMed ID (PMID)</Label>
                      <Input
                        id="pmid"
                        placeholder="12345678"
                        value={pmidInput}
                        onChange={(e) => setPmidInput(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Example: 30498668
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags-pmid">Tags (optional)</Label>
                      <Input
                        id="tags-pmid"
                        placeholder="orthodontics, clinical-trial, pediatric"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated tags for organization
                      </p>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleAddPMID}
                        disabled={isLoading || !pmidInput.trim()}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          'Add Reference'
                        )}
                      </Button>
                    </DialogFooter>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {references.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No references added yet</p>
            <p className="text-sm mt-2">
              Click "Add Reference" to import from DOI or PubMed
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search and Filter */}
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
                <span className="text-sm text-muted-foreground">Filter by tags:</span>
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

            {/* References List */}
            <ScrollArea className="h-[400px] pr-4">
              {Object.entries(referencesByYear)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, yearRefs]) => (
                  <div key={year} className="mb-6">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                      {year} ({yearRefs.length})
                    </h3>
                    <div className="space-y-3">
                      {yearRefs.map(ref => (
                        <div
                          key={ref.id}
                          className="border rounded-lg p-4 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-1">
                              <h4 className="font-medium line-clamp-2">
                                {ref.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                <Users className="inline w-3 h-3 mr-1" />
                                {ref.authors.slice(0, 3).join(', ')}
                                {ref.authors.length > 3 && ` et al.`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <Building className="inline w-3 h-3 mr-1" />
                                {ref.journal}
                                {ref.volume && `, ${ref.volume}`}
                                {ref.issue && `(${ref.issue})`}
                                {ref.pages && `, ${ref.pages}`}
                              </p>
                              {ref.tags && ref.tags.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  {ref.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {onInsertCitation && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleInsertCitation(ref)}
                                  title="Insert citation"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyCitation(ref)}
                                title={`Copy ${selectedFormat.toUpperCase()} citation`}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyBibTeX(ref)}
                                title="Copy BibTeX"
                              >
                                <Hash className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(ref.url || `https://doi.org/${ref.doi}`, '_blank')}
                                title="Open in browser"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveReference(ref.id)}
                                title="Remove reference"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </ScrollArea>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
              <span>
                {filteredReferences.length} of {references.length} references
                {selectedTags.length > 0 && ` (filtered)`}
              </span>
              <span>
                Citation format: {selectedFormat.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}