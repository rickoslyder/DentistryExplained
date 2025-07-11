'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert } from '@/components/ui/alert'
import { 
  Search,
  FileText,
  Heart,
  Stethoscope,
  GraduationCap,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Info
} from 'lucide-react'
import { 
  smartTemplates, 
  getSuggestedTemplates,
  getTemplatesByCategory,
  searchTemplates,
  type SmartTemplate
} from '@/lib/mdx-smart-templates'

interface SmartTemplatesPanelProps {
  content: string
  onInsert: (template: string) => void
}

export function MDXSmartTemplatesPanel({ content, onInsert }: SmartTemplatesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'medical' | 'educational' | 'interactive' | 'general'>('all')
  const [suggestedTemplates, setSuggestedTemplates] = useState<SmartTemplate[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Update suggestions when content changes
  useEffect(() => {
    if (content.length > 50) {
      const suggestions = getSuggestedTemplates(content, 3)
      setSuggestedTemplates(suggestions)
    }
  }, [content])

  // Get filtered templates
  const getFilteredTemplates = () => {
    if (searchQuery) {
      return searchTemplates(searchQuery)
    }
    if (selectedCategory === 'all') {
      return smartTemplates
    }
    return getTemplatesByCategory(selectedCategory)
  }

  const filteredTemplates = getFilteredTemplates()

  const handleCopy = (template: SmartTemplate) => {
    navigator.clipboard.writeText(template.template)
    setCopiedId(template.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const categoryIcons = {
    medical: Stethoscope,
    educational: GraduationCap,
    interactive: MessageSquare,
    general: FileText
  }

  const categoryColors = {
    medical: 'text-red-600',
    educational: 'text-blue-600',
    interactive: 'text-purple-600',
    general: 'text-gray-600'
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Smart Templates
        </CardTitle>
        <CardDescription>
          Pre-built templates for common dental content patterns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="browse" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="suggested" className="relative">
              Suggested
              {suggestedTemplates.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 px-1 text-xs"
                >
                  {suggestedTemplates.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4 mt-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('all')}
              >
                All ({smartTemplates.length})
              </Badge>
              <Badge
                variant={selectedCategory === 'medical' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('medical')}
              >
                <Stethoscope className="w-3 h-3 mr-1" />
                Medical
              </Badge>
              <Badge
                variant={selectedCategory === 'educational' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('educational')}
              >
                <GraduationCap className="w-3 h-3 mr-1" />
                Educational
              </Badge>
              <Badge
                variant={selectedCategory === 'interactive' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('interactive')}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Interactive
              </Badge>
              <Badge
                variant={selectedCategory === 'general' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('general')}
              >
                <FileText className="w-3 h-3 mr-1" />
                General
              </Badge>
            </div>

            {/* Templates List */}
            <ScrollArea className="h-[400px] pr-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No templates found</p>
                  <p className="text-sm mt-2">Try adjusting your search</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTemplates.map((template) => {
                    const Icon = categoryIcons[template.category]
                    const colorClass = categoryColors[template.category]
                    
                    return (
                      <Card key={template.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`w-4 h-4 ${colorClass}`} />
                              <h4 className="font-medium text-sm">{template.name}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {template.description}
                            </p>
                            <div className="flex gap-1 flex-wrap">
                              {template.keywords.slice(0, 3).map((keyword) => (
                                <Badge key={keyword} variant="secondary" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                              {template.keywords.length > 3 && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="secondary" className="text-xs">
                                        +{template.keywords.length - 3}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{template.keywords.slice(3).join(', ')}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopy(template)}
                            >
                              {copiedId === template.id ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => onInsert('\n' + template.template + '\n')}
                            >
                              Insert
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="suggested" className="mt-4">
            {suggestedTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No suggestions yet</p>
                <p className="text-sm mt-2">
                  Start writing to get contextual template suggestions
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4" />
                  <span>Based on your content, these templates might be helpful:</span>
                </div>
                
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {suggestedTemplates.map((template) => {
                      const Icon = categoryIcons[template.category]
                      const colorClass = categoryColors[template.category]
                      
                      return (
                        <Card key={template.id} className="p-4 border-primary/20">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-4 h-4 ${colorClass}`} />
                                <h4 className="font-medium text-sm">{template.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Suggested
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {template.description}
                              </p>
                              <div className="text-xs text-muted-foreground mb-2">
                                <strong>Why suggested:</strong> Your content mentions{' '}
                                {template.keywords
                                  .filter(k => content.toLowerCase().includes(k))
                                  .slice(0, 3)
                                  .map((k, i, arr) => (
                                    <span key={k}>
                                      <code className="bg-muted px-1 py-0.5 rounded">
                                        {k}
                                      </code>
                                      {i < arr.length - 1 && ', '}
                                    </span>
                                  ))}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopy(template)}
                              >
                                {copiedId === template.id ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => onInsert('\n' + template.template + '\n')}
                              >
                                Insert
                              </Button>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}