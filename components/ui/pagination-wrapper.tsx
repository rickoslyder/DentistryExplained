'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface PaginationWrapperProps {
  currentPage: number
  totalPages: number
  pageNumbers: number[]
  hasNextPage: boolean
  hasPreviousPage: boolean
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationWrapper({
  currentPage,
  totalPages,
  pageNumbers,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  className
}: PaginationWrapperProps) {
  if (totalPages <= 1) return null

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious 
            onClick={() => onPageChange(currentPage - 1)}
            className={hasPreviousPage ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
            aria-disabled={!hasPreviousPage}
          />
        </PaginationItem>
        
        {pageNumbers.map((pageNumber, index) => (
          <PaginationItem key={index}>
            {pageNumber === -1 ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(pageNumber)}
                isActive={pageNumber === currentPage}
                className="cursor-pointer"
              >
                {pageNumber}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        
        <PaginationItem>
          <PaginationNext 
            onClick={() => onPageChange(currentPage + 1)}
            className={hasNextPage ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
            aria-disabled={!hasNextPage}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

// Simple pagination info component
interface PaginationInfoProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  className?: string
}

export function PaginationInfo({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  className
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className={`text-sm text-gray-600 ${className || ''}`}>
      Showing {startItem}-{endItem} of {totalItems} results
    </div>
  )
}