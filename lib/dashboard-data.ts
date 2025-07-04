import { createServerSupabaseClient } from "./supabase-auth"

export async function getDashboardStats(userId: string) {
  const supabase = await createServerSupabaseClient()
  
  // Get article views count
  const { count: articlesRead } = await supabase
    .from('article_views')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  
  // Get unique article views for reading time calculation
  const { data: viewData } = await supabase
    .from('article_views')
    .select('article_slug')
    .eq('user_id', userId)
  
  // Calculate approximate reading time (5 min per unique article)
  const uniqueArticles = new Set(viewData?.map(v => v.article_slug) || [])
  const readingTimeMinutes = uniqueArticles.size * 5
  
  // Get bookmarks count
  const { count: bookmarksCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  
  return {
    articlesRead: articlesRead || 0,
    readingTimeMinutes,
    bookmarksCount: bookmarksCount || 0,
    progress: calculateProgress(articlesRead || 0, bookmarksCount || 0)
  }
}

export async function getRecentReading(userId: string, limit = 5) {
  const supabase = await createServerSupabaseClient()
  
  const { data } = await supabase
    .from('article_views')
    .select('article_slug, viewed_at')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(limit)
  
  // Group by article and get most recent view
  const uniqueArticles = new Map<string, Date>()
  data?.forEach(view => {
    if (!uniqueArticles.has(view.article_slug)) {
      uniqueArticles.set(view.article_slug, new Date(view.viewed_at))
    }
  })
  
  return Array.from(uniqueArticles.entries()).map(([slug, viewedAt]) => ({
    slug,
    viewedAt,
    timeAgo: getTimeAgo(viewedAt)
  }))
}

export async function getProfessionalStats(userId: string) {
  const supabase = await createServerSupabaseClient()
  
  // Get user's professional verification status
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_id', userId)
    .single()
  
  if (!profile) return null
  
  const { data: verification } = await supabase
    .from('professional_verifications')
    .select('status')
    .eq('user_id', profile.id)
    .single()
  
  // Get practice listing views if user has a practice
  const { data: practice } = await supabase
    .from('practice_listings')
    .select('id')
    .eq('claimed_by', profile.id)
    .single()
  
  let practiceViews = 0
  if (practice) {
    // In a real implementation, you'd track practice views
    practiceViews = Math.floor(Math.random() * 100) // Mock data
  }
  
  return {
    verificationStatus: verification?.status || 'pending',
    patientsEducated: Math.floor(Math.random() * 200), // Mock data
    materialsDownloaded: Math.floor(Math.random() * 50), // Mock data
    practiceViews,
  }
}

function calculateProgress(articlesRead: number, bookmarks: number): number {
  // Simple progress calculation based on engagement
  const baseProgress = Math.min(articlesRead * 5, 50) // Up to 50% from reading
  const bookmarkProgress = Math.min(bookmarks * 10, 30) // Up to 30% from bookmarking
  const engagementBonus = articlesRead > 5 && bookmarks > 2 ? 20 : 0 // 20% bonus for active users
  
  return Math.min(baseProgress + bookmarkProgress + engagementBonus, 100)
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