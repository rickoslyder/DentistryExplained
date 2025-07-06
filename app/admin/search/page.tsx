'use client'

import { useState, useCallback } from 'react'
import { AdvancedSearchFilters } from '@/components/admin/advanced-search-filters'
import { SearchResultsDisplay } from '@/components/admin/search-results-display'
import { useToast } from '@/hooks/use-toast'

interface SearchFilters {
  status?: string[]
  categories?: string[]
  authors?: string[]
  tags?: string[]
  dateRange?: {
    start?: string
    end?: string
  }
  readingLevel?: string[]
  contentType?: string[]
  hasImages?: boolean
  wordCountRange?: {
    min?: number
    max?: number
  }
}

export default function AdvancedSearchPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [aggregations, setAggregations] = useState<any>()
  const [pagination, setPagination] = useState<any>()
  const [currentQuery, setCurrentQuery] = useState<any>()
  const { toast } = useToast()
  
  const performSearch = useCallback(async (
    query: string,
    filters: SearchFilters,
    sort: { field: string; order: string },
    page: number = 1
  ) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/admin/search/advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters,
          sort,
          pagination: { page, limit: 20 }
        })
      })
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      
      setResults(data.results)
      setAggregations(data.aggregations)
      setPagination(data.pagination)
      setCurrentQuery({ text: query, filters, sort })
      
    } catch (error) {
      toast({
        title: 'Search failed',
        description: 'An error occurred while searching. Please try again.',
        variant: 'destructive'
      })
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [toast])
  
  const handlePageChange = (page: number) => {
    if (currentQuery) {
      performSearch(
        currentQuery.text || '',
        currentQuery.filters || {},
        currentQuery.sort || { field: 'relevance', order: 'desc' },
        page
      )
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Advanced Search</h1>
        <p className="text-gray-600 mt-1">
          Search and filter articles with advanced options
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-4">
          <AdvancedSearchFilters
            onSearch={performSearch}
            aggregations={aggregations}
            isLoading={isLoading}
          />
        </div>
        
        <div className="lg:col-span-4">
          <SearchResultsDisplay
            results={results}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
            query={currentQuery}
          />
        </div>
      </div>
    </div>
  )
}