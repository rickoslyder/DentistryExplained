'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

interface UsePaginationOptions {
  totalItems: number
  itemsPerPage?: number
  initialPage?: number
  syncWithUrl?: boolean
}

interface UsePaginationReturn {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  offset: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  setItemsPerPage: (items: number) => void
  pageNumbers: number[]
}

export function usePagination({
  totalItems,
  itemsPerPage = 20,
  initialPage = 1,
  syncWithUrl = true
}: UsePaginationOptions): UsePaginationReturn {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get initial page from URL or use provided initial page
  const urlPage = syncWithUrl ? parseInt(searchParams.get('page') || '1') : initialPage
  const [currentPage, setCurrentPage] = useState(Math.max(1, urlPage))
  const [perPage, setPerPage] = useState(itemsPerPage)

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

  // Ensure current page is within bounds
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  // Calculate offset for database queries
  const offset = (validCurrentPage - 1) * perPage

  // Update URL when page changes
  const updateUrl = useCallback((page: number) => {
    if (!syncWithUrl) return

    const params = new URLSearchParams(searchParams)
    if (page === 1) {
      params.delete('page')
    } else {
      params.set('page', page.toString())
    }
    
    const query = params.toString()
    router.push(`${pathname}${query ? `?${query}` : ''}`, { scroll: false })
  }, [pathname, router, searchParams, syncWithUrl])

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    const newPage = Math.min(Math.max(1, page), totalPages)
    setCurrentPage(newPage)
    updateUrl(newPage)
  }, [totalPages, updateUrl])

  // Navigation helpers
  const nextPage = useCallback(() => {
    goToPage(validCurrentPage + 1)
  }, [goToPage, validCurrentPage])

  const previousPage = useCallback(() => {
    goToPage(validCurrentPage - 1)
  }, [goToPage, validCurrentPage])

  // Update items per page
  const setItemsPerPage = useCallback((items: number) => {
    setPerPage(items)
    // Reset to first page when changing items per page
    goToPage(1)
  }, [goToPage])

  // Generate page numbers for pagination component
  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const maxVisible = 7 // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate start and end of visible pages
      let start = Math.max(2, validCurrentPage - 2)
      let end = Math.min(totalPages - 1, validCurrentPage + 2)

      // Adjust range to always show maxVisible pages
      if (validCurrentPage <= 3) {
        end = maxVisible - 1
      } else if (validCurrentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 2
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push(-1) // -1 represents ellipsis
      }

      // Add visible page numbers
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push(-1) // -1 represents ellipsis
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }, [totalPages, validCurrentPage])

  return {
    currentPage: validCurrentPage,
    totalPages,
    itemsPerPage: perPage,
    offset,
    hasNextPage: validCurrentPage < totalPages,
    hasPreviousPage: validCurrentPage > 1,
    goToPage,
    nextPage,
    previousPage,
    setItemsPerPage,
    pageNumbers
  }
}

// Hook for "Load More" style pagination
interface UseLoadMoreOptions {
  initialItems: any[]
  fetchMore: (offset: number, limit: number) => Promise<any[]>
  itemsPerPage?: number
}

export function useLoadMore({
  initialItems,
  fetchMore,
  itemsPerPage = 20
}: UseLoadMoreOptions) {
  const [items, setItems] = useState(initialItems)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialItems.length === itemsPerPage)
  const [page, setPage] = useState(1)

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const offset = page * itemsPerPage
      const newItems = await fetchMore(offset, itemsPerPage)
      
      setItems(prev => [...prev, ...newItems])
      setHasMore(newItems.length === itemsPerPage)
      setPage(prev => prev + 1)
    } catch (error) {
      console.error('Failed to load more items:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fetchMore, hasMore, isLoading, itemsPerPage, page])

  return {
    items,
    isLoading,
    hasMore,
    loadMore
  }
}