"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"

export interface Bookmark {
  id: string
  articleSlug: string
  title: string
  category: string
  readTime?: string
  bookmarkedAt: Date
}

export function useBookmarks() {
  const { user, isLoaded } = useUser()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  // Fetch bookmarks from API on mount
  useEffect(() => {
    if (isLoaded && user && !hasFetched) {
      fetchBookmarks()
    }
  }, [isLoaded, user, hasFetched])

  const fetchBookmarks = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/bookmarks')
      if (response.ok) {
        const data = await response.json()
        const formattedBookmarks = data.bookmarks.map((b: any) => ({
          id: b.id,
          articleSlug: b.article_slug,
          title: b.article_title,
          category: b.article_category,
          bookmarkedAt: new Date(b.created_at),
        }))
        setBookmarks(formattedBookmarks)
        setHasFetched(true)
      } else if (response.status === 404 || response.status === 401) {
        // User profile not found or not authenticated - this is expected for new users
        setBookmarks([])
        setHasFetched(true)
      } else {
        throw new Error('Failed to fetch bookmarks')
      }
    } catch (error) {
      // Only log errors that aren't auth-related
      if (!error.message?.includes('401')) {
        console.error("Error fetching bookmarks:", error)
        toast.error("Failed to load bookmarks")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const addBookmark = async (article: {
    slug: string
    title: string
    category: string
    readTime?: string
  }) => {
    if (!user) return false

    setIsLoading(true)
    try {
      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleSlug: article.slug,
          articleTitle: article.title,
          articleCategory: article.category,
        }),
      })

      if (response.ok) {
        // Optimistically update the UI
        const newBookmark: Bookmark = {
          id: `bookmark_${Date.now()}`,
          articleSlug: article.slug,
          title: article.title,
          category: article.category,
          readTime: article.readTime,
          bookmarkedAt: new Date(),
        }
        setBookmarks((prev) => [newBookmark, ...prev])
        toast.success("Article bookmarked")
        return true
      } else if (response.status === 409) {
        toast.info("Article already bookmarked")
        return false
      } else if (response.status === 404) {
        toast.error("Please complete your profile first")
        return false
      } else {
        throw new Error('Failed to add bookmark')
      }
    } catch (error) {
      console.error("Error adding bookmark:", error)
      toast.error("Failed to add bookmark")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removeBookmark = async (articleSlug: string) => {
    if (!user) return false

    setIsLoading(true)
    try {
      const response = await fetch(`/api/bookmarks?articleSlug=${encodeURIComponent(articleSlug)}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Optimistically update the UI
        setBookmarks((prev) => prev.filter((b) => b.articleSlug !== articleSlug))
        toast.success("Bookmark removed")
        return true
      } else if (response.status === 404) {
        toast.error("Please complete your profile first")
        return false
      } else {
        throw new Error('Failed to remove bookmark')
      }
    } catch (error) {
      console.error("Error removing bookmark:", error)
      toast.error("Failed to remove bookmark")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const isBookmarked = (articleSlug: string) => {
    return bookmarks.some((b) => b.articleSlug === articleSlug)
  }

  const toggleBookmark = async (article: {
    slug: string
    title: string
    category: string
    readTime?: string
  }) => {
    if (isBookmarked(article.slug)) {
      return await removeBookmark(article.slug)
    } else {
      return await addBookmark(article)
    }
  }

  return {
    bookmarks,
    isLoading,
    addBookmark,
    removeBookmark,
    isBookmarked,
    toggleBookmark,
    refetch: fetchBookmarks,
  }
}
