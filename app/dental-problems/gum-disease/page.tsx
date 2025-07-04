"use client"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { Button } from "@/components/ui/button"
import { Bookmark } from "lucide-react"

export default function GumDiseasePage() {
  const { isBookmarked, toggleBookmark, isLoading } = useBookmarks()
  const articleData = {
    slug: "dental-problems/gum-disease",
    title: "Gum Disease: Signs, Causes, and Treatment",
    category: "Dental Problems",
    readTime: "7 min",
  }

  return (
    <div>
      <h1>Gum Disease: Signs, Causes, and Treatment</h1>
      <p>This is an article about gum disease.</p>
      <Button variant="outline" size="sm" onClick={() => toggleBookmark(articleData)} disabled={isLoading}>
        <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked(articleData.slug) ? "fill-current" : ""}`} />
        {isBookmarked(articleData.slug) ? "Saved" : "Save Article"}
      </Button>
    </div>
  )
}
