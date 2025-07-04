'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Clock, Filter, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useDebounce } from 'use-debounce'
import { usePagination } from '@/hooks/use-pagination'
import { PaginationWrapper, PaginationInfo } from '@/components/ui/pagination-wrapper'

interface SearchResult {
  id: string
  title: string
  description: string
  type: string
  category: string
  url: string
  relevance?: number
}

interface SearchResponse {
  results: SearchResult[]
  suggestions: Array<{
    suggestion: string
    source: string
  }>
  totalResults: number
  hasMore: boolean
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery] = useDebounce(query, 300)
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<Array<{suggestion: string; source: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [totalResults, setTotalResults] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  
  // Pagination
  const itemsPerPage = 20
  const pagination = usePagination({ 
    totalItems: totalResults, 
    itemsPerPage,
    syncWithUrl: true 
  })
  
  // Define categories statically for now
  const categories = [
    { id: '1', name: 'Dental Problems', slug: 'dental-problems' },
    { id: '2', name: 'Treatments', slug: 'treatments' },
    { id: '3', name: 'Prevention', slug: 'prevention' },
    { id: '4', name: 'Children', slug: 'children' },
    { id: '5', name: 'Emergency', slug: 'emergency' }
  ]
  
  // Perform search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }
    
    const performSearch = async () => {
      setIsLoading(true)
      
      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          ...(categoryFilter !== 'all' && { category: categoryFilter }),
          limit: itemsPerPage.toString(),
          offset: pagination.offset.toString()
        })
        
        const response = await fetch(`/api/search?${params}`)
        const data: SearchResponse = await response.json()
        
        setResults(data.results || [])
        setSuggestions(data.suggestions || [])
        setTotalResults(data.totalResults || 0)
        setHasMore(data.hasMore || false)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }
    
    performSearch()
  }, [debouncedQuery, categoryFilter, pagination.offset])
  
  // Reset pagination when query or filter changes
  useEffect(() => {
    if (pagination.currentPage !== 1) {
      pagination.goToPage(1)
    }
  }, [query, categoryFilter])
  
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200">{part}</mark>
        : part
    )
  }
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Articles</h1>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="search"
              placeholder="Search for dental topics, treatments, conditions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-4 h-12 text-lg"
              autoFocus
            />
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
          </div>
        </div>
        
        {/* Results */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-gray-600">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="mb-4 flex justify-between items-center">
                <PaginationInfo
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={totalResults}
                  itemsPerPage={itemsPerPage}
                />
                {suggestions.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Did you mean:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.slice(0, 3).map((suggestion, idx) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuery(suggestion.suggestion)}
                          className="text-xs"
                        >
                          {suggestion.suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {results.map((result) => (
                <Link key={result.id} href={result.url}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {highlightMatch(result.title, debouncedQuery)}
                          </h3>
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {highlightMatch(result.description, debouncedQuery)}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <Badge variant="secondary">{result.category}</Badge>
                            <Badge variant="outline" className="capitalize">
                              {result.type}
                            </Badge>
                            {result.relevance && (
                              <span className="text-xs text-gray-400">
                                Relevance: {(result.relevance * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              
              {/* Pagination */}
              <PaginationWrapper
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageNumbers={pagination.pageNumbers}
                hasNextPage={pagination.hasNextPage}
                hasPreviousPage={pagination.hasPreviousPage}
                onPageChange={pagination.goToPage}
                className="mt-8"
              />
            </>
          ) : debouncedQuery ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any articles matching "{debouncedQuery}"
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Try:</p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• Using different keywords</li>
                    <li>• Checking your spelling</li>
                    <li>• Using more general terms</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
                <p className="text-gray-600">
                  Enter a keyword to search our dental health articles
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Popular Searches */}
        {!query && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {[
                'tooth decay',
                'gum disease',
                'teeth whitening',
                'dental implants',
                'wisdom teeth',
                'root canal',
                'braces',
                'tooth sensitivity',
              ].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(term)}
                  className="bg-transparent"
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  )
}