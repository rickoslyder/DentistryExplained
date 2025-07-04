"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"

interface DashboardStats {
  articlesRead: number
  readingTimeMinutes: number
  bookmarksCount: number
  progress: number
}

interface RecentArticle {
  slug: string
  viewedAt: Date
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
      // For now, we'll use mock data since we don't have server-side API endpoints for these
      // In a real implementation, you'd create API routes that call the dashboard-data functions
      
      // Mock stats
      setStats({
        articlesRead: 12,
        readingTimeMinutes: 135, // 2h 15m
        bookmarksCount: 5,
        progress: 85
      })

      // Mock recent reading
      setRecentReading([
        {
          slug: "dental-problems/tooth-decay",
          viewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          timeAgo: "2 days ago"
        },
        {
          slug: "prevention/daily-oral-hygiene",
          viewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          timeAgo: "1 week ago"
        }
      ])

      // Mock professional stats if user is professional
      const userMetadata = user.unsafeMetadata as any
      if (userMetadata?.userType === 'professional') {
        setProfessionalStats({
          verificationStatus: userMetadata.verificationStatus || 'pending',
          patientsEducated: 156,
          materialsDownloaded: 23,
          practiceViews: 89
        })
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
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