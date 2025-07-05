'use client'

import { Eye, Users } from 'lucide-react'
import { useArticleViews } from '@/hooks/use-article-views'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ViewCounterProps {
  articleSlug: string
  className?: string
  showCurrentReaders?: boolean
}

export function ViewCounter({ 
  articleSlug, 
  className = '',
  showCurrentReaders = true 
}: ViewCounterProps) {
  const { stats, loading } = useArticleViews(articleSlug)

  if (loading) {
    return (
      <div className={`flex items-center gap-4 text-sm text-muted-foreground ${className}`}>
        <Skeleton className="h-4 w-24" />
        {showCurrentReaders && <Skeleton className="h-4 w-32" />}
      </div>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-4 text-sm text-muted-foreground ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{formatNumber(stats.totalViews)} views</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p>{stats.uniqueVisitors} unique visitors</p>
              <p>{stats.recentViews} views in last 7 days</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {showCurrentReaders && stats.currentReaders > 1 && (
          <div className="flex items-center gap-1 text-green-600">
            <Users className="w-4 h-4" />
            <span>{stats.currentReaders} reading now</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}