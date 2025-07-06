"use client"

import { useState, useEffect } from "react"
import { Search, Clock, BookOpen, FileText, TrendingUp, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { analytics } from "@/lib/analytics-enhanced"

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  type: string
  url: string
  relevance?: number
}

interface SearchSuggestion {
  suggestion: string
  source: string
}

interface TrendingSearch {
  query: string
  search_count: number
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [trending, setTrending] = useState<TrendingSearch[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Fetch trending searches on mount
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch('/api/search/trending?window=7%20days&limit=5')
        if (response.ok) {
          const data = await response.json()
          setTrending(data.trending || [])
        }
      } catch (error) {
        console.error('Failed to fetch trending searches:', error)
      }
    }
    
    if (open) {
      fetchTrending()
    }
  }, [open])

  // Debounced search function
  const performSearch = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearching(true)
    setShowSuggestions(false)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.results || [])
        setSuggestions(data.suggestions || [])
        
        // Track search with analytics
        analytics.trackSearch(searchQuery, data.results?.length || 0)
      } else {
        console.error('Search failed')
        setResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, 300)

  // Fetch suggestions for autocomplete
  const fetchSuggestions = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Suggestions error:', error)
    }
  }, 150)

  useEffect(() => {
    performSearch(query)
    fetchSuggestions(query)
  }, [query, performSearch, fetchSuggestions])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return <BookOpen className="w-4 h-4" />
      case "procedure":
        return <FileText className="w-4 h-4" />
      case "glossary":
        return <Sparkles className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const handleResultClick = async (result: SearchResult) => {
    // Track clicked result
    try {
      await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          clicked_result_id: result.id,
          clicked_result: result.title
        })
      })
      
      // Track with analytics
      analytics.track('search_result_click', {
        search_query: query,
        result_id: result.id,
        result_title: result.title,
        result_type: result.type,
        result_category: result.category,
        result_position: results.findIndex(r => r.id === result.id) + 1,
      })
    } catch (error) {
      console.error('Failed to track click:', error)
    }
    
    onOpenChange(false)
    router.push(result.url)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search dental topics, treatments, and more..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 text-lg h-12"
              autoFocus
            />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-96 px-6 pb-6">
          {!query && (
            <div className="space-y-6">
              {trending.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Trending searches
                  </h3>
                  <div className="space-y-2">
                    {trending.map((item, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-between hover:bg-gray-50"
                        onClick={() => {
                          setQuery(item.query)
                          analytics.track('trending_search_click', {
                            search_query: item.query,
                            search_count: item.search_count,
                            position: index + 1,
                          })
                        }}
                      >
                        <span className="text-sm">{item.query}</span>
                        <span className="text-xs text-gray-400">{item.search_count} searches</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Popular topics</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['Tooth Decay', 'Gum Disease', 'Dental Implants', 'Teeth Whitening', 'Root Canal', 'Braces'].map((topic) => (
                    <Button
                      key={topic}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuery(topic)
                        analytics.track('popular_topic_click', {
                          topic,
                          source: 'search_dialog',
                        })
                      }}
                      className="text-xs"
                    >
                      {topic}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {query && (
            <div className="space-y-2">
              {showSuggestions && suggestions.length > 0 && (
                <div className="border-b pb-2 mb-2">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Suggestions</h4>
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-sm hover:bg-gray-50"
                      onClick={() => handleSuggestionClick(suggestion.suggestion)}
                    >
                      <Search className="w-3 h-3 mr-2 text-gray-400" />
                      {suggestion.suggestion}
                      <Badge variant="outline" className="ml-auto text-xs">
                        {suggestion.source}
                      </Badge>
                    </Button>
                  ))}
                </div>
              )}
              
              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Searching...</p>
                </div>
              ) : results.length > 0 ? (
                results.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-gray-400 mt-1">{getTypeIcon(result.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{result.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{result.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {result.category}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {result.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No results found for "{query}"</p>
                  <p className="text-sm text-gray-400 mt-1">Try different keywords or browse our topics</p>
                </div>
              )}
              
              {results.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="ghost"
                    className="w-full text-primary hover:text-primary"
                    onClick={() => {
                      onOpenChange(false)
                      router.push(`/search?q=${encodeURIComponent(query)}`)
                    }}
                  >
                    View all {results.length}+ results →
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
