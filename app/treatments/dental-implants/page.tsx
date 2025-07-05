"use client"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ViewCounter } from "@/components/article/view-counter"
import { RealtimePresence } from "@/components/article/realtime-presence"
import { useArticleReadingTracker } from "@/hooks/use-reading-history"

export default function Page() {
  const { isBookmarked, toggleBookmark, isLoading } = useBookmarks()
  const articleData = {
    slug: "treatments/dental-implants",
    title: "Dental Implants: Complete Guide",
    category: "Treatments",
    readTime: "12 min",
  }

  // Track reading progress
  useArticleReadingTracker({
    slug: articleData.slug,
    title: articleData.title,
    category: articleData.category,
  })

  return (
    <div>
      <h1>Dental Implants: Complete Guide</h1>
      <p>This is a comprehensive guide to dental implants.</p>
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
