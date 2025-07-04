import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface LoadMoreProps {
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  className?: string
  children?: React.ReactNode
}

export function LoadMore({
  isLoading,
  hasMore,
  onLoadMore,
  className,
  children = 'Load More'
}: LoadMoreProps) {
  if (!hasMore) {
    return (
      <div className="text-center py-4 text-gray-500">
        No more items to load
      </div>
    )
  }

  return (
    <div className={`text-center py-4 ${className || ''}`}>
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={isLoading}
        className="min-w-[120px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          children
        )}
      </Button>
    </div>
  )
}