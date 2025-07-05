"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { BookOpen, Clock, Bookmark, TrendingUp, Calendar, MapPin, Bell, Settings, Stethoscope, CheckCircle, ArrowRight } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { useDashboardData } from "@/hooks/use-dashboard-data"
import { DashboardSkeleton } from "@/components/loading/dashboard-skeleton"
import { ReadingStreak } from "@/components/dashboard/reading-streak"
import { RecentChats } from "@/components/dashboard/recent-chats"
import { QuickActions } from "@/components/dashboard/quick-actions"

interface UserMetadata {
  userType?: "patient" | "professional"
  interests?: string[]
  location?: string
  verificationStatus?: "pending" | "approved" | "rejected"
  onboardingCompleted?: boolean
}


export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [userMetadata, setUserMetadata] = useState<UserMetadata>({})
  const { bookmarks } = useBookmarks()
  const { stats, recentReading, professionalStats, isLoading: statsLoading } = useDashboardData()

  useEffect(() => {
    if (user?.unsafeMetadata) {
      setUserMetadata(user.unsafeMetadata as UserMetadata)
    }
  }, [user])

  if (!isLoaded || statsLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    )
  }

  const isProfessional = userMetadata.userType === "professional"

  // Format recent reading data
  const recentArticles = recentReading.map(article => ({
    title: article.title || article.slug.split('/').pop()?.replace(/-/g, ' ') || 'Unknown Article',
    category: article.category || article.slug.split('/')[0]?.replace(/-/g, ' ') || 'General',
    readTime: "5 min", // We don't track this yet, so use default
    href: `/${article.slug}`,
    readAt: article.timeAgo
  }))

  const bookmarkedArticles = bookmarks.map((bookmark) => ({
    title: bookmark.title,
    category: bookmark.category,
    readTime: bookmark.readTime,
    href: `/${bookmark.articleSlug}`,
  }))

  // Generate recommendations based on reading history
  const getRecommendedArticles = () => {
    const recommendations = []
    
    // If user has read about tooth decay, recommend prevention
    if (recentReading.some(r => r.slug.includes('tooth-decay'))) {
      recommendations.push({
        title: "Preventing Tooth Decay",
        category: "Prevention",
        readTime: "5 min",
        href: "/prevention/preventing-tooth-decay",
        reason: "Related to your recent reading on tooth decay",
      })
    }
    
    // If user has read prevention articles, recommend treatments
    if (recentReading.some(r => r.category === 'prevention')) {
      recommendations.push({
        title: "Common Dental Treatments",
        category: "Treatments",
        readTime: "6 min",
        href: "/treatments/common-procedures",
        reason: "Expand your knowledge on dental treatments",
      })
    }
    
    // Default recommendations if no history
    if (recommendations.length === 0) {
      recommendations.push(
        {
          title: "Daily Oral Hygiene Guide",
          category: "Prevention",
          readTime: "4 min",
          href: "/prevention/daily-oral-hygiene",
          reason: "Essential for everyone",
        },
        {
          title: "Understanding Dental Problems",
          category: "Dental Problems",
          readTime: "5 min",
          href: "/dental-problems",
          reason: "Popular starting point",
        }
      )
    }
    
    return recommendations.slice(0, 2) // Return max 2 recommendations
  }
  
  const recommendedArticles = getRecommendedArticles()

  // Format reading time
  const formatReadingTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.firstName || "there"}!</h1>
              <p className="text-gray-600 mt-1">
                {isProfessional
                  ? "Manage your professional resources and practice"
                  : "Continue your dental health journey"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isProfessional && professionalStats && (
                <Badge
                  variant={
                    professionalStats.verificationStatus === "approved"
                      ? "default"
                      : professionalStats.verificationStatus === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {professionalStats.verificationStatus === "approved"
                    ? "✓ Verified Professional"
                    : professionalStats.verificationStatus === "pending"
                      ? "⏳ Verification Pending"
                      : "❌ Verification Failed"}
                </Badge>
              )}
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm" className="bg-transparent">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Professional Verification Alert */}
        {isProfessional && professionalStats?.verificationStatus === "pending" && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Professional Verification Pending</h3>
                    <p className="text-sm text-yellow-700">
                      We're reviewing your GDC registration. This usually takes 1-2 business days.
                    </p>
                  </div>
                </div>
                <Link href="/professional/verify">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 bg-transparent"
                  >
                    View Status
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reading">Reading</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            {isProfessional && <TabsTrigger value="professional">Professional</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <BookOpen className="w-8 h-8 text-primary" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{stats.articlesRead}</p>
                      <p className="text-sm text-gray-600">Articles Read</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{formatReadingTime(stats.readingTimeMinutes)}</p>
                      <p className="text-sm text-gray-600">Reading Time</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Bookmark className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{bookmarks.length}</p>
                      <p className="text-sm text-gray-600">Bookmarks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold">{stats.currentStreak || 0}</p>
                      <p className="text-sm text-gray-600">Day Streak</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Dashboard Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reading Streak */}
              <ReadingStreak userId={user?.id || ""} />
              
              {/* Quick Actions */}
              <QuickActions userType={userMetadata.userType} />
            </div>

            {/* Recent Chats */}
            <RecentChats userId={user?.id || ""} />

            {/* Recommended Articles */}
            <Card>
              <CardHeader>
                <CardTitle>Recommended for You</CardTitle>
                <CardDescription>Articles tailored to your interests and reading history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendedArticles.map((article, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <Link href={article.href} className="font-medium text-gray-900 hover:text-primary">
                          {article.title}
                        </Link>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span>{article.category}</span>
                          <span>{article.readTime}</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">{article.reason}</p>
                      </div>
                      <Link href={article.href}>
                        <Button variant="outline" size="sm" className="bg-transparent">
                          Read
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reading" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Reading</CardTitle>
                    <CardDescription>Articles you've read recently</CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/reading-history">
                      View Full History
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentArticles.map((article, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <Link href={article.href} className="font-medium text-gray-900 hover:text-primary">
                          {article.title}
                        </Link>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span>{article.category}</span>
                          <span>{article.readTime}</span>
                          <span>Read {article.readAt}</span>
                        </div>
                      </div>
                      <Link href={article.href}>
                        <Button variant="outline" size="sm" className="bg-transparent">
                          Read Again
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Saved Articles</CardTitle>
                    <CardDescription>Articles you've bookmarked for later</CardDescription>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/dashboard/bookmarks">
                      Manage Bookmarks
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookmarkedArticles.map((article, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <Link href={article.href} className="font-medium text-gray-900 hover:text-primary">
                          {article.title}
                        </Link>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span>{article.category}</span>
                          <span>{article.readTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={article.href}>
                          <Button variant="outline" size="sm" className="bg-transparent">
                            Read
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm">
                          <Bookmark className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Professional Features Preview for Patients */}
            {!isProfessional && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Stethoscope className="w-5 h-5 mr-2 text-primary" />
                        Professional Features Available
                      </CardTitle>
                      <CardDescription>
                        Upgrade to access exclusive resources for dental professionals
                      </CardDescription>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      Professional Only
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      Download consent forms and patient materials
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      Manage your practice listing
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      Get verified professional badge
                    </li>
                    <li className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mr-2" />
                      Access clinical guidelines and resources
                    </li>
                  </ul>
                  <Link href="/professional/upgrade">
                    <Button className="w-full">
                      Learn More About Professional Access
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {isProfessional && (
            <TabsContent value="professional" className="space-y-6">
              {/* Professional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <BookOpen className="w-8 h-8 text-primary" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold">{professionalStats?.patientsEducated || 0}</p>
                        <p className="text-sm text-gray-600">Patients Educated</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <Calendar className="w-8 h-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold">{professionalStats?.materialsDownloaded || 0}</p>
                        <p className="text-sm text-gray-600">Materials Downloaded</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <MapPin className="w-8 h-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold">{professionalStats?.practiceViews || 0}</p>
                        <p className="text-sm text-gray-600">Practice Views</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center">
                      <TrendingUp className="w-8 h-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-2xl font-bold">+12%</p>
                        <p className="text-sm text-gray-600">This Month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Professional Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Resources</CardTitle>
                    <CardDescription>Access your professional tools and materials</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href="/professional/consent-forms">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Consent Forms Library
                      </Button>
                    </Link>
                    <Link href="/professional/patient-materials">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <Calendar className="w-4 h-4 mr-2" />
                        Patient Education Materials
                      </Button>
                    </Link>
                    <Link href="/professional/practice">
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <MapPin className="w-4 h-4 mr-2" />
                        Manage Practice Listing
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Downloads</CardTitle>
                    <CardDescription>Your recently downloaded materials</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Root Canal Consent Form</span>
                        <span className="text-gray-500">2 days ago</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Post-Op Care Instructions</span>
                        <span className="text-gray-500">1 week ago</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Oral Hygiene Leaflet</span>
                        <span className="text-gray-500">2 weeks ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <Footer />
    </div>
  )
}
