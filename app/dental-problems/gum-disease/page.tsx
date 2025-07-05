"use client"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { Button } from "@/components/ui/button"
import { Bookmark } from "lucide-react"
import { ViewCounter } from "@/components/article/view-counter"
import { RealtimePresence } from "@/components/article/realtime-presence"
import { useArticleReadingTracker } from "@/hooks/use-reading-history"

export default function GumDiseasePage() {
  const { isBookmarked, toggleBookmark, isLoading } = useBookmarks()
  const articleData = {
    slug: "dental-problems/gum-disease",
    title: "Gum Disease: Signs, Causes, and Treatment",
    category: "Dental Problems",
    readTime: "7 min",
  }

  // Track reading progress
  useArticleReadingTracker({
    slug: articleData.slug,
    title: articleData.title,
    category: articleData.category,
  })

  return (
    <div>
      <h1>Gum Disease: Signs, Causes, and Treatment</h1>
      <p>This is an article about gum disease.</p>
      <div className="flex items-center gap-4 mt-4">
        <ViewCounter articleSlug={articleData.slug} showCurrentReaders={false} />
        <RealtimePresence articleSlug={articleData.slug} />
      </div>
      <Button variant="outline" size="sm" onClick={() => toggleBookmark(articleData)} disabled={isLoading} className="mt-4">
        <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked(articleData.slug) ? "fill-current" : ""}`} />
        {isBookmarked(articleData.slug) ? "Saved" : "Save Article"}
      </Button>
    </div>
  )
}
