'use client'

import { useReadingHistory } from '@/hooks/use-reading-history'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Clock, CheckCircle, Flame, ChevronRight, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function ReadingHistoryPage() {
  const { history, stats, loading } = useReadingHistory()

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Reading History</h2>
          <p className="text-muted-foreground">Track your learning progress</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
            </Card>
          ))}
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

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Reading History</h2>
        <p className="text-muted-foreground">Track your learning progress</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Articles Read
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats.total_articles_read}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reading Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">
                {formatReadingTime(stats.total_reading_time_minutes)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{stats.articles_completed}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-600" />
              <span className="text-2xl font-bold">{stats.current_streak_days}</span>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reading History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          <Button variant="outline" size="sm" asChild>
            <Link href="/topics">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Articles
            </Link>
          </Button>
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No reading history yet</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-4">
                Start reading articles to track your progress and build your knowledge
              </p>
              <Button asChild>
                <Link href="/topics">Start Learning</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {history.map((entry) => (
              <Card key={entry.id} className="group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/${entry.article_category || 'articles'}/${entry.article_slug}`}
                        className="group"
                      >
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {entry.article_title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span>
                          Last read {formatDistanceToNow(new Date(entry.last_read_at), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.ceil(entry.read_duration_seconds / 60)} min
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      {entry.completed ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Completed</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm text-muted-foreground">
                            {entry.scroll_percentage}% read
                          </span>
                          <Progress 
                            value={entry.scroll_percentage} 
                            className="w-20 h-2"
                          />
                        </div>
                      )}
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/${entry.article_category || 'articles'}/${entry.article_slug}`}>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}