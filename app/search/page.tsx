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

interface SearchResult {
  id: string
  title: string
  slug: string
  excerpt: string
  category: {
    name: string
    slug: string
  }
  read_time: number
  views: number
  tags: string[]
  published_at: string
  relevance?: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery] = useDebounce(query, 300)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('relevance')
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>([])
  
  // Fetch categories for filter
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error)
  }, [])
  
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
          category: categoryFilter,
          sort: sortBy,
        })
        
        const response = await fetch(`/api/search?${params}`)
        const data = await response.json()
        
        setResults(data.results || [])
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }
    
    performSearch()
  }, [debouncedQuery, categoryFilter, sortBy])
  
  // Update URL when query changes
  useEffect(() => {
    const newParams = new URLSearchParams()
    if (query) newParams.set('q', query)
    
    const newUrl = `/search${newParams.toString() ? `?${newParams}` : ''}`
    window.history.replaceState({}, '', newUrl)
  }, [query])
  
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
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Most Relevant</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
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
              <p className="text-sm text-gray-600 mb-4">
                Found {results.length} result{results.length !== 1 ? 's' : ''} for "{debouncedQuery}"
              </p>
              {results.map((result) => (
                <Link key={result.id} href={`/${result.category.slug}/${result.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {highlightMatch(result.title, debouncedQuery)}
                          </h3>
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {highlightMatch(result.excerpt, debouncedQuery)}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <Badge variant="secondary">{result.category.name}</Badge>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {result.read_time} min read
                            </span>
                            <span>{result.views} views</span>
                          </div>
                          {result.tags && result.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {result.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
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