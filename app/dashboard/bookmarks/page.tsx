'use client'

import { useBookmarks } from '@/hooks/use-bookmarks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BookmarkX, Clock, ChevronRight, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function BookmarksPage() {
  const { bookmarks, isLoading, removeBookmark } = useBookmarks()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">My Bookmarks</h2>
          <p className="text-muted-foreground">Articles you've saved for later</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">My Bookmarks</h2>
          <p className="text-muted-foreground">Articles you've saved for later</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Start bookmarking articles to save them for later reading
            </p>
            <Button asChild>
              <Link href="/topics">Browse Articles</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Group bookmarks by category
  const bookmarksByCategory = bookmarks.reduce((acc, bookmark) => {
    const category = bookmark.category || 'Uncategorized'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(bookmark)
    return acc
  }, {} as Record<string, typeof bookmarks>)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">My Bookmarks</h2>
        <p className="text-muted-foreground">
          {bookmarks.length} {bookmarks.length === 1 ? 'article' : 'articles'} saved
        </p>
      </div>

      {Object.entries(bookmarksByCategory).map(([category, categoryBookmarks]) => (
        <div key={category} className="space-y-3">
          <h3 className="text-lg font-semibold capitalize">
            {category.replace('-', ' ')}
          </h3>
          <div className="grid gap-3">
            {categoryBookmarks.map((bookmark) => (
              <Card key={bookmark.id} className="group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/${bookmark.category}/${bookmark.articleSlug}`}
                        className="group"
                      >
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {bookmark.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {bookmark.readTime || '5 min read'}
                        </span>
                        <span>
                          Saved {formatDistanceToNow(bookmark.bookmarkedAt, { addSuffix: true })}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBookmark(bookmark.articleSlug)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <BookmarkX className="h-4 w-4" />
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/${bookmark.category}/${bookmark.articleSlug}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}