"use client"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Page() {
  const { isBookmarked, toggleBookmark, isLoading } = useBookmarks()
  const articleData = {
    slug: "treatments/dental-implants",
    title: "Dental Implants: Complete Guide",
    category: "Treatments",
    readTime: "12 min",
  }

  return (
    <div>
      <h1>Dental Implants: Complete Guide</h1>
      <p>This is a comprehensive guide to dental implants.</p>
      <Button variant="outline" size="sm" onClick={() => toggleBookmark(articleData)} disabled={isLoading}>
        <Bookmark className={`w-4 h-4 mr-2 ${isBookmarked(articleData.slug) ? "fill-current" : ""}`} />
        {isBookmarked(articleData.slug) ? "Saved" : "Save Article"}
      </Button>
    </div>
  )
}
