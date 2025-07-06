'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Activity, MessageSquare, FileText, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActiveUser {
  id: string
  type: 'patient' | 'professional' | 'guest'
  currentPage: string
  timeOnSite: number
  actions: number
}

interface RealtimeData {
  activeUsers: ActiveUser[]
  activeChatSessions: number
  currentPageViews: Record<string, number>
  recentEvents: Array<{
    id: string
    event: string
    user: string
    timestamp: Date
  }>
}

interface RealtimeMetricsProps {
  initialData?: RealtimeData
}

export function RealtimeMetrics({ initialData }: RealtimeMetricsProps) {
  const [data, setData] = useState<RealtimeData>(initialData || {
    activeUsers: [],
    activeChatSessions: 0,
    currentPageViews: {},
    recentEvents: [],
  })

  // Simulate real-time updates (in production, this would be WebSocket or SSE)
  useEffect(() => {
    const interval = setInterval(() => {
      // This would be replaced with actual real-time data fetching
      setData(prev => ({
        ...prev,
        activeUsers: prev.activeUsers.map(user => ({
          ...user,
          timeOnSite: user.timeOnSite + 1,
        })),
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'professional':
        return 'bg-purple-100 text-purple-800'
      case 'patient':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Get top pages being viewed
  const topPages = Object.entries(data.currentPageViews)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="grid gap-4">
      {/* Live Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Active Now
              <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.activeUsers.filter(u => u.type === 'professional').length} professionals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeChatSessions}</div>
            <p className="text-xs text-muted-foreground">AI conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Page Views/min</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(data.currentPageViews).reduce((a, b) => a + b, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Across all pages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(
                data.activeUsers.reduce((acc, u) => acc + u.timeOnSite, 0) / 
                (data.activeUsers.length || 1)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Time on site</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Top Pages Right Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPages.map(([page, count]) => (
                <div key={page} className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate max-w-[250px]">{page}</p>
                  <Badge variant="secondary">{count} users</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Circle className="w-2 h-2 fill-current" />
                    <span className="font-medium">{event.event}</span>
                    <span className="text-muted-foreground">by {event.user}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Users Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Active Users Detail
          </CardTitle>
          <CardDescription>
            Real-time view of users currently on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.activeUsers.slice(0, 10).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Badge className={getUserTypeColor(user.type)} variant="secondary">
                    {user.type}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{user.currentPage}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(user.timeOnSite)} on site · {user.actions} actions
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  <Circle className="w-2 h-2 fill-green-500 text-green-500 mr-1" />
                  Active
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}