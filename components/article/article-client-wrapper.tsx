'use client'

import { Button } from "@/components/ui/button"
import { Bookmark, Share2, BookOpen } from "lucide-react"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { ViewCounter } from "@/components/article/view-counter"
import { RealtimePresence } from "@/components/article/realtime-presence"
import { useArticleReadingTracker } from "@/hooks/use-reading-history"

interface ArticleClientWrapperProps {
  articleData: {
    slug: string
    title: string
    category: string
    readTime?: string
  }
}

export function ArticleClientWrapper({ articleData }: ArticleClientWrapperProps) {
  const { isBookmarked, toggleBookmark, isLoading } = useBookmarks()

  // Track reading progress
  useArticleReadingTracker({
    slug: articleData.slug,
    title: articleData.title,
    category: articleData.category,
  })

  return (
    <>
      <ViewCounter articleSlug={articleData.slug} showCurrentReaders={false} />
      <RealtimePresence articleSlug={articleData.slug} />
      
      <div className="flex items-center space-x-4 mb-8">
        <Button variant="outline" size="sm" onClick={() => toggleBookmark(articleData)} disabled={isLoading}>
          <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked(articleData.slug) ? "fill-current" : ""}`} />
          {isBookmarked(articleData.slug) ? "Saved" : "Save Article"}
        </Button>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" size="sm">
          <BookOpen className="w-4 h-4 mr-2" />
          Reading Level: Basic
        </Button>
      </div>
    </>
  )
}