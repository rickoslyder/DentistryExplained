'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useCSRFContext } from '@/components/providers/csrf-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Save, 
  Eye, 
  X, 
  Plus,
  Info,
  FileText,
  Settings,
  Search,
  History,
  Calendar,
  Sparkles,
  Tags,
  Globe
} from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { validateMDX } from '@/lib/mdx'
import { processMDXPreview } from '@/lib/mdx-utils'
import { useAutosave } from '@/hooks/use-autosave'
import { sanitizeArticleContent, sanitizePlainText } from '@/lib/sanitization'
import dynamic from 'next/dynamic'
import { ResearchProgressModal, ResearchStage } from '@/components/admin/research-progress-modal'
import { BookOpen } from 'lucide-react'
import type { MedicalReference, CitationFormat } from '@/lib/doi-validator'

// Dynamically import MDX editor with advanced features and panels
const MDXEditorAdvancedWithPanels = dynamic(() => import('@/components/admin/mdx-editor-advanced-with-panels').then(mod => ({ default: mod.MDXEditorAdvancedWithPanels })), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
})

// Dynamically import MDX references component
const MDXReferences = dynamic(() => import('@/components/admin/mdx-references').then(mod => ({ default: mod.MDXReferences })), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
})

// Dynamically import basic MDX editor
const MDXEditor = dynamic(() => import('@/components/admin/mdx-editor'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
})

// Dynamically import rich text editor
const MDXRichTextEditor = dynamic(() => import('@/components/admin/mdx-rich-text-editor').then(mod => ({ default: mod.MDXRichTextEditor })), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
})

// Dynamically import version history to avoid SSR issues
const ArticleVersionHistory = dynamic(() => import('@/components/admin/article-version-history').then(mod => ({ default: mod.ArticleVersionHistory })), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
})

// Dynamically import scheduling component to avoid SSR issues
const ArticleScheduling = dynamic(() => import('@/components/admin/article-scheduling').then(mod => ({ default: mod.ArticleScheduling })), {
  ssr: false,
  loading: () => <div className="h-48 bg-gray-50 animate-pulse rounded-lg" />
})

interface Category {
  id: string
  name: string
  slug: string
}

interface ArticleEditorProps {
  categories: Category[]
  article?: {
    id: string
    title: string
    slug: string
    content: string
    excerpt?: string
    category_id?: string
    status: 'draft' | 'published' | 'archived'
    tags?: string[]
    meta_title?: string
    meta_description?: string
    meta_keywords?: string[]
    is_featured: boolean
    allow_comments: boolean
    scheduled_at?: string | null
  }
}

export function ArticleEditor({ categories, article }: ArticleEditorProps) {
  const router = useRouter()
  const { user } = useUser()
  const { secureRequest } = useCSRFContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    content: article?.content || `---
title: ""
excerpt: ""
category: ""
tags: []
---

# Article Title

Start writing your article content here...`,
    excerpt: article?.excerpt || '',
    category_id: article?.category_id || '',
    status: article?.status || 'draft' as const,
    tags: article?.tags || [] as string[],
    meta_title: article?.meta_title || '',
    meta_description: article?.meta_description || '',
    meta_keywords: article?.meta_keywords || [] as string[],
    is_featured: article?.is_featured || false,
    allow_comments: article?.allow_comments ?? true,
  })
  
  const [tagInput, setTagInput] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [changeNotes, setChangeNotes] = useState('')
  const [showChangeNotesDialog, setShowChangeNotesDialog] = useState(false)
  const [isResearching, setIsResearching] = useState(false)
  const [isGeneratingExcerpt, setIsGeneratingExcerpt] = useState(false)
  const [isGeneratingTags, setIsGeneratingTags] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false)
  const [showSEODialog, setShowSEODialog] = useState(false)
  const [seoSettings, setSeoSettings] = useState({
    generateTitle: true,
    generateDescription: true,
    generateKeywords: true
  })
  const [tagSettings, setTagSettings] = useState({
    count: 5,
    mode: 'replace' as 'replace' | 'append'
  })
  const [editorMode, setEditorMode] = useState<'rich' | 'advanced' | 'basic'>('rich')
  const [showResearchDialog, setShowResearchDialog] = useState(false)
  const [researchSettings, setResearchSettings] = useState({
    audience: 'general' as 'general' | 'professional',
    readingLevel: 'intermediate' as 'basic' | 'intermediate' | 'advanced'
  })
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [researchStages, setResearchStages] = useState<ResearchStage[]>([])
  const [researchError, setResearchError] = useState<string | null>(null)
  const [references, setReferences] = useState<MedicalReference[]>([])
  
  // Setup autosave
  const { isSaving, lastSaved, draftId, saveNow } = useAutosave(
    {
      articleId: article?.id,
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      excerpt: formData.excerpt,
      seo_title: formData.meta_title,
      seo_description: formData.meta_description,
      category_id: formData.category_id || null,
      tags: formData.tags,
      featured: formData.is_featured,
      featured_image: null, // Add this to formData if needed
      difficulty_level: researchSettings.readingLevel,
      metadata: {
        status: formData.status,
        allow_comments: formData.allow_comments,
        meta_keywords: formData.meta_keywords,
        references,
      }
    },
    {
      enabled: true,
      delay: 3000, // 3 seconds
      onError: (error) => {
        console.error('Autosave failed:', error)
      }
    }
  )
  
  // Generate slug from title
  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }, [])
  
  // Handle title change and auto-generate slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value
    setFormData(prev => ({
      ...prev,
      title,
      slug: !article ? generateSlug(title) : prev.slug
    }))
  }
  
  // Add tag
  const addTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput]
      }))
      setTagInput('')
    }
  }
  
  // Remove tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }
  
  // Add keyword
  const addKeyword = () => {
    if (keywordInput && !formData.meta_keywords.includes(keywordInput)) {
      setFormData(prev => ({
        ...prev,
        meta_keywords: [...prev.meta_keywords, keywordInput]
      }))
      setKeywordInput('')
    }
  }
  
  // Remove keyword
  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      meta_keywords: prev.meta_keywords.filter(k => k !== keyword)
    }))
  }
  
  // Validate form
  const validateForm = () => {
    const newErrors: string[] = []
    
    if (!formData.title) newErrors.push('Title is required')
    if (!formData.slug) newErrors.push('Slug is required')
    if (!formData.content) newErrors.push('Content is required')
    if (!formData.category_id) newErrors.push('Category is required')
    
    // Validate MDX
    const { isValid, errors: mdxErrors } = validateMDX(formData.content)
    if (!isValid) {
      newErrors.push(...mdxErrors)
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }
  
  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving')
      return
    }
    
    // For existing articles, show change notes dialog
    if (article) {
      setShowChangeNotesDialog(true)
      return
    }
    
    // For new articles, save directly
    performSave()
  }
  
  // Perform the actual save
  const performSave = async () => {
    setIsSubmitting(true)
    
    try {
      const endpoint = article 
        ? `/api/admin/articles/${article.id}`
        : '/api/admin/articles'
      
      // Sanitize content before saving
      const sanitizedData = {
        ...formData,
        content: sanitizeArticleContent(formData.content),
        title: sanitizePlainText(formData.title),
        excerpt: formData.excerpt ? sanitizePlainText(formData.excerpt) : '',
        meta_title: formData.meta_title ? sanitizePlainText(formData.meta_title) : '',
        meta_description: formData.meta_description ? sanitizePlainText(formData.meta_description) : '',
        tags: formData.tags.map(tag => sanitizePlainText(tag)),
        meta_keywords: formData.meta_keywords.map(keyword => sanitizePlainText(keyword)),
      }
      
      const payload = {
        ...sanitizedData,
        ...(article && changeNotes ? { changeNotes: sanitizePlainText(changeNotes) } : {})
      }
      
      const response = await secureRequest(endpoint, {
        method: article ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save article')
      }
      
      const result = await response.json()
      
      toast.success(article ? 'Article updated!' : 'Article created!')
      
      // Reset change notes
      setChangeNotes('')
      setShowChangeNotesDialog(false)
      
      // Redirect to edit page if creating new
      if (!article) {
        router.push(`/admin/articles/${result.id}/edit`)
      } else {
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to save article')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Get preview data
  const getPreviewData = () => {
    const { frontmatter, excerpt, readTime } = processMDXPreview(formData.content)
    return {
      ...frontmatter,
      title: formData.title || frontmatter.title,
      excerpt: formData.excerpt || excerpt,
      category: categories.find(c => c.id === formData.category_id)?.name,
      readTime,
    }
  }
  
  // Handle AI excerpt generation
  const handleGenerateExcerpt = async () => {
    if (!formData.title) {
      toast.error('Please enter a title first')
      return
    }
    
    setIsGeneratingExcerpt(true)
    
    try {
      const response = await secureRequest('/api/admin/ai/generate-excerpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: categories.find(c => c.id === formData.category_id)?.name,
          tags: formData.tags,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate excerpt')
      }
      
      const result = await response.json()
      
      if (result.success && result.excerpt) {
        setFormData(prev => ({
          ...prev,
          excerpt: result.excerpt
        }))
        toast.success('Excerpt generated successfully!')
      } else {
        throw new Error('No excerpt returned')
      }
    } catch (error) {
      toast.error('Failed to generate excerpt')
      console.error('Excerpt generation error:', error)
    } finally {
      setIsGeneratingExcerpt(false)
    }
  }
  
  // Handle AI research
  const handleResearch = () => {
    if (!formData.title) {
      toast.error('Please enter a title to research the topic')
      return
    }
    
    setShowResearchDialog(true)
  }
  
  // Handle AI tag generation
  const handleGenerateTags = () => {
    if (!formData.title && !formData.content && !formData.excerpt) {
      toast.error('Please provide a title, content, or excerpt to generate tags')
      return
    }
    
    setShowTagDialog(true)
  }
  
  // Perform tag generation
  const performTagGeneration = async () => {
    setShowTagDialog(false)
    setIsGeneratingTags(true)
    
    try {
      const response = await secureRequest('/api/admin/ai/generate-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          category: categories.find(c => c.id === formData.category_id)?.name,
          existingTags: formData.tags,
          tagCount: tagSettings.count,
          mode: tagSettings.mode,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate tags')
      }
      
      const result = await response.json()
      
      if (result.success && result.tags) {
        if (tagSettings.mode === 'replace') {
          setFormData(prev => ({
            ...prev,
            tags: result.tags
          }))
          toast.success(`Generated ${result.tags.length} tags`)
        } else {
          setFormData(prev => ({
            ...prev,
            tags: [...prev.tags, ...result.tags]
          }))
          toast.success(`Added ${result.tags.length} new tags`)
        }
      } else {
        throw new Error('No tags returned')
      }
    } catch (error) {
      toast.error('Failed to generate tags')
      console.error('Tag generation error:', error)
    } finally {
      setIsGeneratingTags(false)
    }
  }
  
  // Handle AI SEO generation
  const handleGenerateSEO = () => {
    if (!formData.title && !formData.content && !formData.excerpt) {
      toast.error('Please provide a title, content, or excerpt to generate SEO metadata')
      return
    }
    
    setShowSEODialog(true)
  }
  
  // Perform SEO generation
  const performSEOGeneration = async () => {
    setShowSEODialog(false)
    setIsGeneratingSEO(true)
    
    try {
      const response = await secureRequest('/api/admin/ai/generate-seo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          category: categories.find(c => c.id === formData.category_id)?.name,
          tags: formData.tags,
          currentMetaTitle: formData.meta_title,
          currentMetaDescription: formData.meta_description,
          currentMetaKeywords: formData.meta_keywords,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate SEO metadata')
      }
      
      const result = await response.json()
      
      if (result.success && result.suggestions) {
        const updates: Partial<typeof formData> = {}
        
        if (seoSettings.generateTitle && result.suggestions.metaTitle) {
          updates.meta_title = result.suggestions.metaTitle.value
        }
        if (seoSettings.generateDescription && result.suggestions.metaDescription) {
          updates.meta_description = result.suggestions.metaDescription.value
        }
        if (seoSettings.generateKeywords && result.suggestions.metaKeywords) {
          updates.meta_keywords = result.suggestions.metaKeywords.value
        }
        
        setFormData(prev => ({ ...prev, ...updates }))
        
        const fieldsUpdated = Object.keys(updates).length
        toast.success(`Updated ${fieldsUpdated} SEO field${fieldsUpdated !== 1 ? 's' : ''}`)
      } else {
        throw new Error('No SEO suggestions returned')
      }
    } catch (error) {
      toast.error('Failed to generate SEO metadata')
      console.error('SEO generation error:', error)
    } finally {
      setIsGeneratingSEO(false)
    }
  }
  
  // Perform research with selected settings
  const performResearch = async () => {
    setShowResearchDialog(false)
    setIsResearching(true)
    setShowProgressModal(true)
    setResearchError(null)
    setResearchStages([])
    
    try {
      const response = await secureRequest('/api/admin/research/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: formData.title,
          reportType: 'research_report',
          sourcesCount: 10,
          focusMedical: true,
          includeCitations: true,
          audience: researchSettings.audience,
          readingLevel: researchSettings.readingLevel,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Research failed')
      }
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }
      
      const decoder = new TextDecoder()
      let buffer = ''
      let researchContent = ''
      
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
              
              if (data.type === 'stages') {
                setResearchStages(data.stages)
              } else if (data.type === 'stage_update') {
                setResearchStages(prev => 
                  prev.map(s => s.id === data.stageId ? { ...s, ...data.update } : s)
                )
              } else if (data.type === 'content') {
                researchContent = data.content
              } else if (data.type === 'draft_created') {
                // Draft was automatically created from research
                if (data.draftId) {
                  toast.success(data.message || 'Draft saved automatically')
                }
              } else if (data.type === 'complete') {
                if (researchContent) {
                  setFormData(prev => ({
                    ...prev,
                    content: researchContent
                  }))
                  // Manual save to trigger autosave immediately with the new content
                  saveNow()
                  const successMessage = data.draftId 
                    ? `AI research draft generated and saved!`
                    : `AI research draft generated for ${researchSettings.audience} audience!`
                  toast.success(successMessage)
                  setShowProgressModal(false)
                }
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate AI research draft'
      setResearchError(errorMessage)
      toast.error(errorMessage)
      console.error('Research error:', error)
    } finally {
      setIsResearching(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content">
            <FileText className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="references">
            <BookOpen className="w-4 h-4 mr-2" />
            References
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="w-4 h-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="versions" disabled={!article} title={!article ? "Save the article first to view version history" : "View version history"}>
            <History className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <div className="flex gap-2">
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={handleTitleChange}
                      placeholder="Enter article title"
                      className="flex-1"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleResearch}
                            disabled={isResearching || !formData.title}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            {isResearching ? 'Researching...' : 'Research'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{!formData.title 
                            ? 'Add a title to research the topic' 
                            : 'Generate AI research draft based on the title'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="article-slug"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateExcerpt}
                          disabled={isGeneratingExcerpt || !formData.title}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {isGeneratingExcerpt ? 'Generating...' : 'Generate'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{!formData.title 
                          ? 'Add a title to generate an excerpt' 
                          : 'Generate excerpt using AI based on title and content'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief description of the article"
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.excerpt.length}/200 characters (optimal for SEO)
                </p>
              </div>
              
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Tags</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateTags}
                          disabled={isGeneratingTags || (!formData.title && !formData.content && !formData.excerpt)}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {isGeneratingTags ? 'Generating...' : 'Generate'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{(!formData.title && !formData.content && !formData.excerpt) 
                          ? 'Add title, content, or excerpt to generate tags' 
                          : 'Generate tags using AI based on article content'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" onClick={addTag} variant="outline">
                          <Plus className="w-4 h-4" />
                          <span className="sr-only">Add tag</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add this tag to the article</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {formData.tags.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.tags.length} tags
                  </p>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Content (MDX)</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Editor:</span>
                    <Button
                      type="button"
                      size="sm"
                      variant={editorMode === 'rich' ? 'default' : 'outline'}
                      onClick={() => setEditorMode('rich')}
                      title="Use rich text editor with WYSIWYG formatting"
                    >
                      Rich Text
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editorMode === 'advanced' ? 'default' : 'outline'}
                      onClick={() => setEditorMode('advanced')}
                      title="Use enhanced editor with smart templates and AI suggestions"
                    >
                      Advanced
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={editorMode === 'basic' ? 'default' : 'outline'}
                      onClick={() => setEditorMode('basic')}
                      title="Use basic editor with simple formatting"
                    >
                      Basic
                    </Button>
                  </div>
                </div>
                <div className="h-[600px]">
                  {editorMode === 'rich' ? (
                    <MDXRichTextEditor
                      value={formData.content}
                      onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                      placeholder="Start typing your article..."
                      className="h-full"
                    />
                  ) : editorMode === 'advanced' ? (
                    <MDXEditorAdvancedWithPanels
                      value={formData.content}
                      onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                      placeholder="Write your article in MDX format..."
                      className="h-full"
                    />
                  ) : (
                    <MDXEditor
                      value={formData.content}
                      onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="references" className="space-y-6">
          <div className="space-y-4">
            <MDXReferences 
              references={references}
              onReferencesChange={setReferences}
              onInsertCitation={(reference, format) => {
                // Import the formatCitation function
                import('@/lib/doi-validator').then(({ formatCitation }) => {
                  // Generate formatted citation text
                  const formattedCitation = formatCitation(reference, format)
                  
                  // Create citation with reference ID for linking
                  const citationText = `\n\n## Citation\n\n${formattedCitation}\n\n<!-- Reference ID: ${reference.id} -->`
                  
                  // Insert citation at the end of content
                  const currentContent = formData.content
                  const newContent = currentContent + citationText
                  setFormData(prev => ({ ...prev, content: newContent }))
                  
                  toast.success(`${format.toUpperCase()} citation inserted into editor`)
                })
              }}
            />
            
            {/* Generate full reference list button */}
            {references.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Generate Reference List</CardTitle>
                  <CardDescription>
                    Add a complete reference list to the end of your article
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    type="button"
                    onClick={() => {
                      import('@/lib/doi-validator').then(({ formatCitation }) => {
                        // Generate reference list
                        let referenceList = '\n\n## References\n\n'
                        references.forEach((ref, index) => {
                          const formattedRef = formatCitation(ref, 'apa') // Default to APA format
                          referenceList += `${index + 1}. ${formattedRef}\n\n`
                        })
                        
                        // Add to content
                        const currentContent = formData.content
                        // Remove existing references section if present
                        const referencesIndex = currentContent.lastIndexOf('## References')
                        const contentWithoutRefs = referencesIndex > -1 
                          ? currentContent.substring(0, referencesIndex).trimEnd()
                          : currentContent
                        
                        const newContent = contentWithoutRefs + referenceList
                        setFormData(prev => ({ ...prev, content: newContent }))
                        
                        toast.success('Reference list added to article')
                      })
                    }}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Generate Reference List
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>SEO Settings</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateSEO}
                        disabled={isGeneratingSEO || (!formData.title && !formData.content && !formData.excerpt)}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {isGeneratingSEO ? 'Generating...' : 'Generate All'}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{(!formData.title && !formData.content && !formData.excerpt) 
                        ? 'Add title, content, or excerpt to generate SEO metadata' 
                        : 'Generate SEO title, description, and keywords using AI'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="SEO title (max 60 characters)"
                  maxLength={60}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.meta_title.length}/60 characters
                </p>
              </div>
              
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="SEO description (max 160 characters)"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.meta_description.length}/160 characters
                </p>
              </div>
              
              <div>
                <Label>Meta Keywords</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Add keyword"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button type="button" onClick={addKeyword} variant="outline">
                          <Plus className="w-4 h-4" />
                          <span className="sr-only">Add keyword</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add this keyword for SEO</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.meta_keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Article Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'draft' | 'published' | 'archived') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_featured: checked }))
                  }
                />
                <Label htmlFor="featured">Featured Article</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="comments"
                  checked={formData.allow_comments}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, allow_comments: checked }))
                  }
                />
                <Label htmlFor="comments">Allow Comments</Label>
              </div>
            </CardContent>
          </Card>
          
          {/* Article Scheduling */}
          <ArticleScheduling
            articleId={article?.id || ''}
            articleStatus={formData.status}
            currentScheduledAt={article?.scheduled_at}
            onScheduleUpdate={(scheduledAt) => {
              // Refresh the page to show updated schedule status
              if (article) {
                router.refresh()
              }
            }}
          />
        </TabsContent>
        
        <TabsContent value="versions" className="space-y-6">
          {article && (
            <ArticleVersionHistory 
              articleId={article.id}
              currentVersion={{
                title: formData.title,
                updated_at: new Date().toISOString()
              }}
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="bg-transparent"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Quick Preview
          </Button>
          {article && (
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/articles/${article.id}/preview`)}
              className="bg-transparent"
            >
              <Eye className="w-4 h-4 mr-2" />
              Full Preview
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-4 flex-1">
          <div className="text-sm text-muted-foreground">
            {isSaving && (
              <span className="flex items-center gap-2">
                <div className="h-2 w-2 bg-orange-500 rounded-full animate-pulse" />
                Saving draft...
              </span>
            )}
            {!isSaving && lastSaved && (
              <span>
                Draft saved {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Saving...' : (article ? 'Update' : 'Create')} Article
            </Button>
          </div>
        </div>
      </div>
      
      {/* Quick Preview - only show for basic editor */}
      {showPreview && !useAdvancedEditor && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <h1>{getPreviewData().title}</h1>
              {getPreviewData().excerpt && (
                <p className="text-xl text-gray-600">{getPreviewData().excerpt}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{getPreviewData().category}</span>
                <span>{getPreviewData().readTime} min read</span>
              </div>
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  Use the Advanced editor for live MDX preview, or save to see full preview
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Change Notes Dialog */}
      <Dialog open={showChangeNotesDialog} onOpenChange={setShowChangeNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Describe Your Changes</DialogTitle>
            <DialogDescription>
              Provide a brief summary of the changes you made. This helps track the version history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              placeholder="e.g., Updated treatment options section, fixed typos in prevention paragraph"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowChangeNotesDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={performSave} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Research Settings Dialog */}
      <Dialog open={showResearchDialog} onOpenChange={setShowResearchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure AI Research</DialogTitle>
            <DialogDescription>
              Choose how the AI should write the research content based on your target audience.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Target Audience</Label>
              <Select
                value={researchSettings.audience}
                onValueChange={(value: 'general' | 'professional') => 
                  setResearchSettings(prev => ({ ...prev, audience: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    <div className="flex flex-col">
                      <span>General Public / Patients</span>
                      <span className="text-xs text-gray-500">Clear, accessible language for laypeople</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="professional">
                    <div className="flex flex-col">
                      <span>Dental Professionals</span>
                      <span className="text-xs text-gray-500">Clinical terminology and evidence-based content</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label>Reading Level</Label>
              <Select
                value={researchSettings.readingLevel}
                onValueChange={(value: 'basic' | 'intermediate' | 'advanced') => 
                  setResearchSettings(prev => ({ ...prev, readingLevel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">
                    <div className="flex flex-col">
                      <span>Basic</span>
                      <span className="text-xs text-gray-500">
                        {researchSettings.audience === 'general' 
                          ? 'Simple language, no jargon'
                          : 'For students or new professionals'}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <div className="flex flex-col">
                      <span>Intermediate</span>
                      <span className="text-xs text-gray-500">
                        {researchSettings.audience === 'general'
                          ? 'Clear language with explained terms'
                          : 'For practicing professionals'}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="flex flex-col">
                      <span>Advanced</span>
                      <span className="text-xs text-gray-500">
                        {researchSettings.audience === 'general'
                          ? 'Detailed with technical explanations'
                          : 'For specialists and researchers'}
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                The AI will adapt its language complexity, terminology usage, and content depth based on these settings.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResearchDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={performResearch}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Research
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Research Progress Modal */}
      <ResearchProgressModal
        open={showProgressModal}
        onOpenChange={setShowProgressModal}
        topic={formData.title}
        stages={researchStages}
        error={researchError}
      />
      
      {/* Tag Generation Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Tags with AI</DialogTitle>
            <DialogDescription>
              Configure how AI should generate tags for your article based on the available metadata.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label>Number of Tags</Label>
              <Select
                value={tagSettings.count.toString()}
                onValueChange={(value) => 
                  setTagSettings(prev => ({ ...prev, count: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} tags
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label>Generation Mode</Label>
              <RadioGroup
                value={tagSettings.mode}
                onValueChange={(value: 'replace' | 'append') => 
                  setTagSettings(prev => ({ ...prev, mode: value }))
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="replace" />
                  <Label htmlFor="replace" className="font-normal cursor-pointer">
                    <div>
                      <div className="font-medium">Replace all tags</div>
                      <div className="text-sm text-gray-500">Generate a new set of tags</div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="append" id="append" />
                  <Label htmlFor="append" className="font-normal cursor-pointer">
                    <div>
                      <div className="font-medium">Add to existing tags</div>
                      <div className="text-sm text-gray-500">
                        Generate tags that complement current ones
                        {formData.tags.length > 0 && ` (${formData.tags.length} existing)`}
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                AI will analyze your article's title, excerpt, content, and category to suggest relevant dental-specific tags for SEO and discoverability.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTagDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={performTagGeneration}>
              <Tags className="w-4 h-4 mr-2" />
              Generate Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* SEO Generation Dialog */}
      <Dialog open={showSEODialog} onOpenChange={setShowSEODialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate SEO Metadata</DialogTitle>
            <DialogDescription>
              Select which SEO fields to generate based on your article content.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate-title"
                  checked={seoSettings.generateTitle}
                  onCheckedChange={(checked) => 
                    setSeoSettings(prev => ({ ...prev, generateTitle: !!checked }))
                  }
                />
                <Label htmlFor="generate-title" className="font-normal cursor-pointer">
                  <div>
                    <div className="font-medium">Meta Title</div>
                    <div className="text-sm text-gray-500">
                      SEO-optimized page title (50-60 characters)
                      {formData.meta_title && ` • Current: ${formData.meta_title.length} chars`}
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate-description"
                  checked={seoSettings.generateDescription}
                  onCheckedChange={(checked) => 
                    setSeoSettings(prev => ({ ...prev, generateDescription: !!checked }))
                  }
                />
                <Label htmlFor="generate-description" className="font-normal cursor-pointer">
                  <div>
                    <div className="font-medium">Meta Description</div>
                    <div className="text-sm text-gray-500">
                      Search result snippet (150-160 characters)
                      {formData.meta_description && ` • Current: ${formData.meta_description.length} chars`}
                    </div>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate-keywords"
                  checked={seoSettings.generateKeywords}
                  onCheckedChange={(checked) => 
                    setSeoSettings(prev => ({ ...prev, generateKeywords: !!checked }))
                  }
                />
                <Label htmlFor="generate-keywords" className="font-normal cursor-pointer">
                  <div>
                    <div className="font-medium">Meta Keywords</div>
                    <div className="text-sm text-gray-500">
                      SEO keywords (5-10 keywords)
                      {formData.meta_keywords.length > 0 && ` • Current: ${formData.meta_keywords.length} keywords`}
                    </div>
                  </div>
                </Label>
              </div>
            </div>
            
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                AI will analyze your article content and generate SEO-optimized metadata following best practices for dental health content.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSEODialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={performSEOGeneration}
              disabled={!seoSettings.generateTitle && !seoSettings.generateDescription && !seoSettings.generateKeywords}
            >
              <Globe className="w-4 h-4 mr-2" />
              Generate SEO
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}