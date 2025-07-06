'use client'

import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { analytics } from '@/lib/analytics-enhanced'

interface BookmarkButtonProps {
  article: {
    slug: string
    title: string
    category: string
    readTime?: string
  }
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  showText?: boolean
}

export function BookmarkButton({
  article,
  variant = 'ghost',
  size = 'icon',
  className,
  showText = false,
}: BookmarkButtonProps) {
  const { user } = useUser()
  const router = useRouter()
  const { isBookmarked, toggleBookmark, isLoading } = useBookmarks()
  
  const bookmarked = isBookmarked(article.slug)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      // Track bookmark attempt without auth
      analytics.track('bookmark_auth_required', {
        article_slug: article.slug,
        article_title: article.title,
        article_category: article.category,
      })
      router.push(`/sign-in?redirect_url=${window.location.pathname}`)
      return
    }

    // Track bookmark action
    const action = bookmarked ? 'remove' : 'add'
    analytics.track('bookmark_action', {
      action,
      article_slug: article.slug,
      article_title: article.title,
      article_category: article.category,
      article_read_time: article.readTime,
    })

    await toggleBookmark(article)
  }

  const buttonContent = (
    <>
      {bookmarked ? (
        <BookmarkCheck className={cn('h-4 w-4', showText && 'mr-2')} />
      ) : (
        <Bookmark className={cn('h-4 w-4', showText && 'mr-2')} />
      )}
      {showText && (bookmarked ? 'Bookmarked' : 'Bookmark')}
    </>
  )

  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        'transition-colors',
        bookmarked && 'text-primary hover:text-primary/80',
        className
      )}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      {buttonContent}
    </Button>
  )

  if (!showText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{bookmarked ? 'Remove bookmark' : 'Bookmark this article'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}