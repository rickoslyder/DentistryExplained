'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  Sparkles,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Type,
  Component,
  FileText,
  ChevronRight,
  RefreshCw,
  Settings,
  Brain,
  Wand2
} from 'lucide-react'
import { 
  getAISuggestions, 
  MDXSuggestionProvider,
  type AISuggestion 
} from '@/lib/mdx-ai-suggestions'
import { toast } from 'sonner'

interface AISuggestionsPanelProps {
  content: string
  cursorPosition: number
  onApplySuggestion: (suggestion: string) => void
  apiEndpoint?: string
  apiKey?: string
}

export function MDXAISuggestionsPanel({ 
  content, 
  cursorPosition,
  onApplySuggestion,
  apiEndpoint,
  apiKey
}: AISuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [autoSuggest, setAutoSuggest] = useState(true)
  const [selectedType, setSelectedType] = useState<'all' | AISuggestion['type']>('all')
  const [activeTab, setActiveTab] = useState<'all' | 'suggested' | 'browse'>('all')
  const suggestionProviderRef = useRef<MDXSuggestionProvider | null>(null)

  // Initialize suggestion provider
  useEffect(() => {
    suggestionProviderRef.current = new MDXSuggestionProvider(
      (newSuggestions) => {
        setSuggestions(newSuggestions)
        setIsLoading(false)
      },
      apiEndpoint,
      apiKey
    )

    return () => {
      suggestionProviderRef.current?.destroy()
    }
  }, [apiEndpoint, apiKey])

  // Update content
  useEffect(() => {
    if (autoSuggest && suggestionProviderRef.current) {
      setIsLoading(true)
      suggestionProviderRef.current.updateContent(content, cursorPosition)
    }
  }, [content, cursorPosition, autoSuggest])

  // Manual refresh
  const handleRefresh = () => {
    setIsLoading(true)
    const newSuggestions = getAISuggestions(content, cursorPosition)
    setSuggestions(newSuggestions)
    setIsLoading(false)
    toast.success('Suggestions refreshed')
  }

  // Filter suggestions by type
  const filteredSuggestions = selectedType === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.type === selectedType)

  // Group suggestions by type
  const groupedSuggestions = filteredSuggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.type]) {
      acc[suggestion.type] = []
    }
    acc[suggestion.type].push(suggestion)
    return acc
  }, {} as Record<AISuggestion['type'], AISuggestion[]>)

  const typeConfig = {
    component: { icon: Component, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    content: { icon: FileText, color: 'text-green-600', bgColor: 'bg-green-50' },
    correction: { icon: Type, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    enhancement: { icon: Lightbulb, color: 'text-purple-600', bgColor: 'bg-purple-50' }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden" role="region" aria-label="AI Suggestions Panel">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            <CardTitle>AI Suggestions</CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Refresh suggestions"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={autoSuggest ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setAutoSuggest(!autoSuggest)}
                    aria-label={`Turn auto-suggest ${autoSuggest ? 'off' : 'on'}`}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Auto-suggest: {autoSuggest ? 'On' : 'Off'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <CardDescription>
          AI-powered suggestions to improve your content
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col p-3">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-3 px-1">
            <TabsTrigger value="all" className="px-2 relative overflow-hidden">
              <span className="truncate">All</span>
              {suggestions.length > 0 && (
                <Badge className="ml-1 h-4 px-1 text-[10px] transition-all duration-200">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggested" className="px-2 relative overflow-hidden">
              <span className="truncate">Suggested</span>
              {suggestions.length > 0 && (
                <Badge className="ml-1 h-4 px-1 text-[10px] transition-all duration-200">
                  {Math.min(5, suggestions.length)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="browse" className="px-2">
              <span className="truncate">Browse</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="flex flex-col flex-1 mt-4 min-h-0">
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(typeConfig).map(([type, config]) => {
                const count = suggestions.filter(s => s.type === type).length
                return (
                  <Badge
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedType(type as any)}
                  >
                    <config.icon className="w-3 h-3 mr-1" />
                    {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                  </Badge>
                )
              })}
            </div>

            {filteredSuggestions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center min-h-0">
                <div className="text-center p-8 text-muted-foreground">
                    <div className="relative">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <p className="font-medium">No suggestions available</p>
                    <p className="text-sm mt-2">
                      {autoSuggest ? 'Suggestions will appear as you type' : 'Click refresh to get suggestions'}
                    </p>
                    <div className="mt-6 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">AI looks for:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        <Badge variant="outline" className="text-xs">Spelling errors</Badge>
                        <Badge variant="outline" className="text-xs">Missing components</Badge>
                        <Badge variant="outline" className="text-xs">Content improvements</Badge>
                      </div>
                    </div>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0">
                <div className="pr-3 space-y-4">
                    {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => {
                      const config = typeConfig[type as AISuggestion['type']]
                      const Icon = config.icon
                      
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Icon className={`w-4 h-4 ${config.color}`} />
                            <span>{type.charAt(0).toUpperCase() + type.slice(1)} Suggestions</span>
                          </div>
                          
                          {typeSuggestions.map((suggestion, index) => (
                            <Card key={`${type}-${index}`} className="p-2 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20">
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-sm font-medium line-clamp-1 flex-1 min-w-0">{suggestion.title}</h4>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge 
                                            variant="outline" 
                                            className={`text-[10px] flex-shrink-0 ${getConfidenceColor(suggestion.confidence || 0.7)}`}
                                          >
                                            {getConfidenceLabel(suggestion.confidence || 0.7)}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Confidence: {Math.round((suggestion.confidence || 0.7) * 100)}%</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {suggestion.description}
                                  </p>
                                </div>
                                
                                {suggestion.context && (
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    <span className="font-medium">Context:</span> {suggestion.context}
                                  </div>
                                )}
                                
                                {suggestion.suggestion && (
                                  <div className="space-y-1.5 pt-1.5 border-t">
                                    <div className="h-16 w-full rounded border bg-muted overflow-hidden">
                                      <ScrollArea className="h-full w-full">
                                        <code className="text-[10px] p-1.5 block whitespace-pre overflow-x-auto">
                                          {suggestion.suggestion}
                                        </code>
                                      </ScrollArea>
                                    </div>
                                    <Button
                                      size="sm"
                                      className="w-full h-7 text-xs"
                                      onClick={() => {
                                        onApplySuggestion(suggestion.suggestion)
                                        toast.success('Suggestion applied')
                                      }}
                                      aria-label={`Apply ${suggestion.title} suggestion`}
                                    >
                                      <Wand2 className="w-3 h-3 mr-1 flex-shrink-0" />
                                      <span className="truncate">Apply</span>
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      )
                    })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="suggested" className="flex flex-col flex-1 mt-4 min-h-0">
            {suggestions.length === 0 ? (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Start typing to see context-aware suggestions based on your content.
                </AlertDescription>
              </Alert>
            ) : (
              <ScrollArea className="flex-1 min-h-0">
                <div className="pr-3 space-y-3">
                  {suggestions.slice(0, 5).map((suggestion, index) => {
                    const config = typeConfig[suggestion.type]
                    const Icon = config.icon
                    
                    return (
                      <Card key={`suggested-${index}`} className="p-3 border-primary/20 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/40">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Icon className={`w-4 h-4 ${config.color} flex-shrink-0`} />
                              <h4 className="text-sm font-medium line-clamp-1">{suggestion.title}</h4>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] flex-shrink-0 ${getConfidenceColor(suggestion.confidence || 0.7)}`}
                            >
                              {getConfidenceLabel(suggestion.confidence || 0.7)}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {suggestion.description}
                          </p>
                          
                          {suggestion.context && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Why suggested:</span> {suggestion.context}
                            </div>
                          )}
                          
                          {suggestion.suggestion && (
                            <div className="pt-2 border-t">
                              <div className="h-12 w-full rounded border bg-muted overflow-hidden mb-2">
                                <ScrollArea className="h-full w-full">
                                  <code className="text-[10px] p-1.5 block whitespace-pre overflow-x-auto">
                                    {suggestion.suggestion}
                                  </code>
                                </ScrollArea>
                              </div>
                              <Button
                                size="sm"
                                className="w-full h-7 text-xs"
                                onClick={() => {
                                  onApplySuggestion(suggestion.suggestion)
                                  toast.success('Suggestion applied')
                                }}
                              >
                                <Wand2 className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">Apply Suggestion</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="browse" className="flex flex-col flex-1 mt-4 min-h-0">
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  Browse all available MDX components and templates.
                </AlertDescription>
              </Alert>
              
              <Card>
                <div className="p-4 space-y-2">
                  <h4 className="font-medium">Quick Tips</h4>
                  {!content && (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        Start writing to get AI-powered suggestions!
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {!content.includes('#') && content.length > 300 && (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        Consider adding headings to structure your content better.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {content.includes('treatment') && !content.toLowerCase().includes('disclaimer') && (
                    <Alert>
                      <AlertCircle className="w-4 h-4" />
                      <AlertDescription>
                        Medical content detected. Consider adding a disclaimer.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}