'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { Calendar, Clock, Eye, User, Tag, FileText, ChevronLeft, ChevronRight } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  slug: string
  excerpt: string
  status: string
  published_at: string | null
  view_count: number
  read_time: number
  featured_image?: string
  category: {
    id: string
    name: string
    slug: string
  }
  author: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

interface SearchResultsDisplayProps {
  results: SearchResult[]
  isLoading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  query?: {
    text?: string
    filters?: any
    sort?: any
  }
}

export function SearchResultsDisplay({ 
  results, 
  isLoading, 
  pagination, 
  onPageChange,
  query 
}: SearchResultsDisplayProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }
  
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-gray-500">
            {query?.text 
              ? `No articles match your search for "${query.text}"`
              : 'Try adjusting your filters to find articles'}
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {pagination && (
            <>
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
              {query?.text && ` for "${query.text}"`}
            </>
          )}
        </p>
      </div>
      
      {/* Results List */}
      <div className="space-y-4">
        {results.map((result) => (
          <Card key={result.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    <Link 
                      href={`/admin/articles/${result.id}/edit`}
                      className="hover:underline"
                    >
                      {result.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {result.author.first_name} {result.author.last_name}
                    </span>
                    {result.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(result.published_at), 'MMM d, yyyy')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {result.read_time} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {result.view_count} views
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    result.status === 'published' ? 'default' :
                    result.status === 'draft' ? 'secondary' :
                    'outline'
                  }>
                    {result.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 line-clamp-3">{result.excerpt}</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />
                  {result.category.name}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/articles/${result.slug}`} target="_blank">
                <Button variant="outline" size="sm">
                  View Article
                </Button>
              </Link>
              <Link href={`/admin/articles/${result.id}/edit`}>
                <Button size="sm">
                  Edit
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {generatePaginationNumbers(pagination.page, pagination.totalPages).map((pageNum, idx) => (
              pageNum === '...' ? (
                <span key={idx} className="px-2 text-gray-500">...</span>
              ) : (
                <Button
                  key={idx}
                  variant={pageNum === pagination.page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange?.(pageNum as number)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              )
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

function generatePaginationNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const delta = 2
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i)
    }
  }

  range.forEach((i) => {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  })

  return rangeWithDots
}