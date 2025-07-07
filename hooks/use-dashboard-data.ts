"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"

interface DashboardStats {
  articlesRead: number
  readingTimeMinutes: number
  bookmarksCount: number
  articlesCompleted: number
  currentStreak: number
  progress: number
}

interface RecentArticle {
  slug: string
  title: string | null
  category: string | null
  lastReadAt: string
  timeAgo: string
}

interface ProfessionalStats {
  verificationStatus: 'pending' | 'approved' | 'rejected'
  patientsEducated: number
  materialsDownloaded: number
  practiceViews: number
}

export function useDashboardData() {
  const { user, isLoaded } = useUser()
  const [stats, setStats] = useState<DashboardStats>({
    articlesRead: 0,
    readingTimeMinutes: 0,
    bookmarksCount: 0,
    articlesCompleted: 0,
    currentStreak: 0,
    progress: 0
  })
  const [recentReading, setRecentReading] = useState<RecentArticle[]>([])
  const [professionalStats, setProfessionalStats] = useState<ProfessionalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      fetchDashboardData()
    }
  }, [isLoaded, user])

  const fetchDashboardData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Fetch real dashboard stats from API
      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }

      const data = await response.json()
      
      // Set stats from API response
      setStats(data.stats)
      
      // Format recent reading with time ago
      const formattedReading = data.recentReading.map((article: any) => ({
        ...article,
        timeAgo: getTimeAgo(new Date(article.lastReadAt))
      }))
      setRecentReading(formattedReading)
      
      // Set professional stats if available
      if (data.professionalStats) {
        setProfessionalStats(data.professionalStats)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      // Fallback to empty data on error
      setStats({
        articlesRead: 0,
        readingTimeMinutes: 0,
        bookmarksCount: 0,
        articlesCompleted: 0,
        currentStreak: 0,
        progress: 0
      })
      setRecentReading([])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    stats,
    recentReading,
    professionalStats,
    isLoading,
    refetch: fetchDashboardData
  }
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " years ago"
  
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " months ago"
  
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " days ago"
  
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " hours ago"
  
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " minutes ago"
  
  return "just now"
}