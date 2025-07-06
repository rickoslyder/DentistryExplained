'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
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
  History
} from 'lucide-react'
import { toast } from 'sonner'
import { validateMDX, processMDXPreview } from '@/lib/mdx'
import dynamic from 'next/dynamic'

// Dynamically import MDX editor to avoid SSR issues
const MDXEditor = dynamic(() => import('@/components/admin/mdx-editor'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
})

// Dynamically import version history to avoid SSR issues
const ArticleVersionHistory = dynamic(() => import('@/components/admin/article-version-history').then(mod => ({ default: mod.ArticleVersionHistory })), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
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
  }
}

export function ArticleEditor({ categories, article }: ArticleEditorProps) {
  const router = useRouter()
  const { user } = useUser()
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
      
      const payload = {
        ...formData,
        ...(article && changeNotes ? { changeNotes } : {})
      }
      
      const response = await fetch(endpoint, {
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">
            <FileText className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="w-4 h-4 mr-2" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="versions" disabled={!article}>
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
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="Enter article title"
                  />
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
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief description of the article"
                  rows={3}
                />
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
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
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
              </div>
              
              <div>
                <Label>Content (MDX)</Label>
                <MDXEditor
                  value={formData.content}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
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
                  <Button type="button" onClick={addKeyword} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
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
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          className="bg-transparent"
        >
          <Eye className="w-4 h-4 mr-2" />
          {showPreview ? 'Hide' : 'Show'} Preview
        </Button>
        
        <div className="flex items-center gap-2">
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
      
      {/* Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Article Preview</CardTitle>
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
                  Full MDX preview will be shown in the article view
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
    </div>
  )
}