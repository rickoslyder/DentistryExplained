'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Library, 
  Plus, 
  Search,
  Copy,
  Edit,
  Trash2,
  Download,
  Upload,
  FileText,
  Code,
  Star,
  StarOff,
  FolderOpen,
  Hash,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

export interface Snippet {
  id: string
  name: string
  description?: string
  content: string
  category: string
  tags: string[]
  favorite?: boolean
  createdAt: Date
  updatedAt: Date
  usageCount?: number
}

interface SnippetsLibraryProps {
  onInsert: (content: string) => void
  className?: string
}

const defaultCategories = [
  'General',
  'Clinical',
  'Patient Info',
  'Procedures',
  'Warnings',
  'Instructions',
  'Legal',
  'Components'
]

const defaultSnippets: Snippet[] = [
  {
    id: 'disclaimer-1',
    name: 'Medical Disclaimer',
    description: 'Standard medical advice disclaimer',
    content: '> **Medical Disclaimer**: This information is for educational purposes only and should not replace professional dental advice. Always consult with a qualified dentist for proper diagnosis and treatment.',
    category: 'Legal',
    tags: ['disclaimer', 'legal', 'warning'],
    favorite: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'post-op-1',
    name: 'Post-Op Instructions',
    description: 'Standard post-operative care instructions',
    content: `## Post-Operative Care Instructions

1. **Bleeding**: Bite on gauze for 30-45 minutes. Some oozing is normal for 24 hours.
2. **Pain**: Take prescribed medication as directed. Use ice packs for first 24 hours.
3. **Diet**: Soft foods only for first 24-48 hours. Avoid hot liquids and straws.
4. **Hygiene**: Gentle rinse after 24 hours. Resume brushing carefully after 48 hours.
5. **Activity**: Rest for 24 hours. Avoid strenuous activity for 3-5 days.

**Contact us immediately if you experience:**
- Excessive bleeding
- Severe pain not controlled by medication
- Fever over 101°F
- Difficulty swallowing`,
    category: 'Instructions',
    tags: ['post-op', 'care', 'instructions'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'consent-1',
    name: 'Consent Statement',
    description: 'Basic treatment consent statement',
    content: 'By proceeding with treatment, I understand the risks, benefits, and alternatives that have been explained to me. I consent to the recommended treatment plan.',
    category: 'Legal',
    tags: ['consent', 'legal'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'emergency-1',
    name: 'Emergency Warning',
    description: 'Dental emergency alert',
    content: `<Alert type="emergency">
  <strong>Dental Emergency</strong>
  If you're experiencing severe pain, facial swelling, uncontrolled bleeding, or difficulty swallowing, seek immediate medical attention at your nearest A&E or call 111.
</Alert>`,
    category: 'Warnings',
    tags: ['emergency', 'urgent', 'warning'],
    favorite: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pre-op-1',
    name: 'Pre-Op Instructions',
    description: 'Pre-operative preparation instructions',
    content: `## Pre-Operative Instructions

**The Day Before Your Procedure:**
- Get a good night's rest
- Arrange transportation (you cannot drive after sedation)
- Do not eat or drink after midnight if sedation is planned

**The Day of Your Procedure:**
- Take prescribed medications with small sip of water
- Wear comfortable, loose-fitting clothing
- Remove jewelry, contact lenses, and nail polish
- Arrive 15 minutes early for paperwork

**Important Reminders:**
- Inform us of any medication changes
- Report any illness or fever
- Bring a list of current medications`,
    category: 'Instructions',
    tags: ['pre-op', 'preparation', 'instructions'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'oral-hygiene-1',
    name: 'Oral Hygiene Instructions',
    description: 'Basic oral hygiene guidance',
    content: `## Oral Hygiene Instructions

**Daily Care:**
1. Brush twice daily for 2 minutes using fluoride toothpaste
2. Use gentle circular motions at 45-degree angle to gum line
3. Floss daily to remove plaque between teeth
4. Use mouthwash as recommended

**Technique Tips:**
- Replace toothbrush every 3 months
- Clean tongue to reduce bacteria
- Wait 30 minutes after eating before brushing
- Use soft-bristled toothbrush`,
    category: 'Patient Info',
    tags: ['hygiene', 'brushing', 'flossing'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'risks-1',
    name: 'Common Procedure Risks',
    description: 'Standard risks and complications',
    content: `**Common Risks and Complications:**
- Bleeding and swelling
- Infection at the treatment site
- Temporary or permanent numbness
- Damage to adjacent teeth
- Need for additional treatment
- Allergic reaction to materials or medications

Your dentist will discuss specific risks related to your treatment.`,
    category: 'Clinical',
    tags: ['risks', 'complications', 'informed-consent'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'sensitivity-1',
    name: 'Tooth Sensitivity Advice',
    description: 'Managing tooth sensitivity',
    content: `<Alert type="tip">
  <strong>Managing Tooth Sensitivity</strong>
  
  If you experience sensitivity:
  - Use toothpaste designed for sensitive teeth
  - Avoid very hot or cold foods and drinks
  - Use a soft-bristled toothbrush
  - Consider using a fluoride rinse
  
  Sensitivity should improve within 2-4 weeks. Contact us if it persists or worsens.
</Alert>`,
    category: 'Patient Info',
    tags: ['sensitivity', 'aftercare', 'advice'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'nhs-bands-1',
    name: 'NHS Dental Charges',
    description: 'Current NHS dental band charges',
    content: `<CostTable costs={[
  { item: "Band 1 - Examination, diagnosis, preventive care", cost: "£25.80", nhs: true },
  { item: "Band 2 - Fillings, extractions, root canal", cost: "£70.70", nhs: true },
  { item: "Band 3 - Crowns, dentures, bridges", cost: "£306.80", nhs: true },
  { item: "Urgent dental treatment", cost: "£25.80", nhs: true }
]} />`,
    category: 'Components',
    tags: ['nhs', 'costs', 'charges'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'pain-scale-1',
    name: 'Pain Assessment Scale',
    description: 'Patient pain rating component',
    content: `<SymptomSeverityScale 
  title="Rate Your Current Pain Level"
  description="This helps us understand your discomfort and provide appropriate treatment"
  showGuide={true}
/>`,
    category: 'Components',
    tags: ['pain', 'assessment', 'component'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export function MDXSnippetsLibrary({ onInsert, className }: SnippetsLibraryProps) {
  const [snippets, setSnippets] = useState<Snippet[]>(defaultSnippets)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    category: 'General',
    tags: ''
  })

  // Load snippets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mdx-snippets')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setSnippets([...defaultSnippets, ...parsed])
      } catch (e) {
        console.error('Failed to load snippets:', e)
      }
    }
  }, [])

  // Save custom snippets to localStorage
  const saveSnippets = (updatedSnippets: Snippet[]) => {
    const customSnippets = updatedSnippets.filter(s => !defaultSnippets.find(d => d.id === s.id))
    localStorage.setItem('mdx-snippets', JSON.stringify(customSnippets))
    setSnippets(updatedSnippets)
  }

  // Filter snippets
  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = searchQuery === '' || 
      snippet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || snippet.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = ['All', ...Array.from(new Set([...defaultCategories, ...snippets.map(s => s.category)]))]

  const handleCreate = () => {
    const newSnippet: Snippet = {
      id: `custom-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      content: formData.content,
      category: formData.category,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0
    }
    
    saveSnippets([...snippets, newSnippet])
    setShowCreateDialog(false)
    resetForm()
    toast.success('Snippet created successfully')
  }

  const handleUpdate = () => {
    if (!editingSnippet) return
    
    const updatedSnippets = snippets.map(s => 
      s.id === editingSnippet.id 
        ? {
            ...s,
            name: formData.name,
            description: formData.description,
            content: formData.content,
            category: formData.category,
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            updatedAt: new Date()
          }
        : s
    )
    
    saveSnippets(updatedSnippets)
    setEditingSnippet(null)
    resetForm()
    toast.success('Snippet updated successfully')
  }

  const handleDelete = (id: string) => {
    const updatedSnippets = snippets.filter(s => s.id !== id)
    saveSnippets(updatedSnippets)
    toast.success('Snippet deleted')
  }

  const handleToggleFavorite = (id: string) => {
    const updatedSnippets = snippets.map(s => 
      s.id === id ? { ...s, favorite: !s.favorite } : s
    )
    saveSnippets(updatedSnippets)
  }

  const handleInsert = (snippet: Snippet) => {
    // Update usage count
    const updatedSnippets = snippets.map(s => 
      s.id === snippet.id 
        ? { ...s, usageCount: (s.usageCount || 0) + 1 }
        : s
    )
    saveSnippets(updatedSnippets)
    
    onInsert(snippet.content)
    toast.success('Snippet inserted')
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(snippets, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `mdx-snippets-${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
    
    toast.success('Snippets exported')
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        if (Array.isArray(imported)) {
          const newSnippets = imported.filter(imp => 
            !snippets.find(s => s.id === imp.id)
          )
          saveSnippets([...snippets, ...newSnippets])
          toast.success(`Imported ${newSnippets.length} snippets`)
        }
      } catch (error) {
        toast.error('Failed to import snippets')
      }
    }
    reader.readAsText(file)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      category: 'General',
      tags: ''
    })
  }

  const openEditDialog = (snippet: Snippet) => {
    setEditingSnippet(snippet)
    setFormData({
      name: snippet.name,
      description: snippet.description || '',
      content: snippet.content,
      category: snippet.category,
      tags: snippet.tags.join(', ')
    })
  }

  // Sort snippets: favorites first, then by usage count
  const sortedSnippets = [...filteredSnippets].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1
    if (!a.favorite && b.favorite) return 1
    return (b.usageCount || 0) - (a.usageCount || 0)
  })

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Library className="h-5 w-5" />
              Snippets Library
            </CardTitle>
            <CardDescription>
              Reusable content snippets for faster editing
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Label htmlFor="import-snippets" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                </span>
              </Button>
              <Input
                id="import-snippets"
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </Label>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Snippet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Snippet</DialogTitle>
                  <DialogDescription>
                    Create a reusable content snippet
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Snippet name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {defaultCategories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Snippet content (Markdown/MDX)"
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} disabled={!formData.name || !formData.content}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <FolderOpen className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Snippets List */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {sortedSnippets.map(snippet => (
                <Card key={snippet.id} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{snippet.name}</h4>
                        {snippet.favorite && (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        )}
                        {snippet.usageCount && snippet.usageCount > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Used {snippet.usageCount}x
                          </Badge>
                        )}
                      </div>
                      {snippet.description && (
                        <p className="text-sm text-muted-foreground">{snippet.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="secondary">{snippet.category}</Badge>
                        {snippet.tags.map(tag => (
                          <span key={tag} className="text-muted-foreground">
                            <Hash className="inline h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFavorite(snippet.id)}
                      >
                        {snippet.favorite ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(snippet)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!defaultSnippets.find(d => d.id === snippet.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(snippet.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleInsert(snippet)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Insert
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingSnippet} onOpenChange={(open) => !open && setEditingSnippet(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Snippet</DialogTitle>
            <DialogDescription>
              Update snippet content and properties
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Snippet name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {defaultCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Snippet content (Markdown/MDX)"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSnippet(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name || !formData.content}>
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}