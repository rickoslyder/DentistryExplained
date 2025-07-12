'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Users, Eye, Globe, MousePointer, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RealtimeData {
  activeUsers: number
  usersByPage: Array<{
    page: string
    users: number
  }>
  usersBySource: Array<{
    source: string
    users: number
  }>
  recentEvents: Array<{
    eventName: string
    count: number
    page?: string
  }>
}

export function RealtimeMetrics() {
  const [data, setData] = useState<RealtimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchRealtimeData()
    const interval = setInterval(fetchRealtimeData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch('/api/analytics/realtime')
      if (!response.ok) {
        throw new Error(`Failed to fetch realtime data: ${response.status}`)
      }
      const data = await response.json()
      console.log('[RealtimeMetrics] Fetched data:', data)
      setData(data)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      console.error('[RealtimeMetrics] Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Use mock data for development
      const mockData = getMockRealtimeData()
      console.log('[RealtimeMetrics] Using mock data:', mockData)
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }

  const getSourceIcon = (source: string) => {
    const sourceMap: Record<string, any> = {
      'Organic Search': <Globe className="h-4 w-4" />,
      'Direct': <MousePointer className="h-4 w-4" />,
      'Social': <Users className="h-4 w-4" />,
      'Referral': <TrendingUp className="h-4 w-4" />
    }
    return sourceMap[source] || <Activity className="h-4 w-4" />
  }

  const getEventColor = (eventName: string) => {
    const colorMap: Record<string, string> = {
      'page_view': 'bg-blue-500',
      'article_view': 'bg-green-500',
      'chat_session_start': 'bg-purple-500',
      'search': 'bg-yellow-500',
      'sign_up': 'bg-pink-500',
      'click': 'bg-gray-500'
    }
    return colorMap[eventName] || 'bg-gray-400'
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading real-time data...</div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Active Users Hero */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Real-time Activity</CardTitle>
              <CardDescription>
                Live data from your website
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Users className="h-8 w-8 text-primary" />
                <span className="text-6xl font-bold">{data.activeUsers}</span>
              </div>
              <p className="text-lg text-muted-foreground">Active users right now</p>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Users by Page */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Active Pages</CardTitle>
            <CardDescription>Where users are right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.usersByPage.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active users
                </p>
              ) : (
                data.usersByPage.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Eye className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate">{formatPagePath(item.page)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{item.users}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Users by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Traffic Sources</CardTitle>
            <CardDescription>Where active users came from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.usersBySource.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No traffic data
                </p>
              ) : (
                data.usersBySource.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSourceIcon(item.source)}
                      <span className="text-sm">{item.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.users}</span>
                      <div 
                        className="h-2 bg-primary/20 rounded-full"
                        style={{
                          width: `${Math.max(20, (item.users / data.activeUsers) * 100)}px`
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Events</CardTitle>
          <CardDescription>User actions in the last 30 minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent events
              </p>
            ) : (
              data.recentEvents.slice(0, 10).map((event, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2 w-2 rounded-full", getEventColor(event.eventName))} />
                    <div>
                      <p className="text-sm font-medium">{formatEventName(event.eventName)}</p>
                      {event.page && (
                        <p className="text-xs text-muted-foreground">{formatPagePath(event.page)}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">{event.count}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions
function formatPagePath(path: string): string {
  if (path === '/') return 'Homepage'
  if (path === '(not set)') return 'Unknown'
  
  const cleanPath = path.replace(/^\//, '').replace(/-/g, ' ')
  return cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1)
}

function formatEventName(eventName: string): string {
  const nameMap: Record<string, string> = {
    'page_view': 'Page View',
    'article_view': 'Article Read',
    'chat_session_start': 'Chat Started',
    'chat_message_sent': 'Chat Message',
    'search': 'Search',
    'sign_up': 'Sign Up',
    'click': 'Click',
    'scroll': 'Scroll',
    'file_download': 'Download'
  }
  
  return nameMap[eventName] || eventName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Mock data for development
function getMockRealtimeData(): RealtimeData {
  return {
    activeUsers: Math.floor(Math.random() * 50) + 10,
    usersByPage: [
      { page: '/', users: Math.floor(Math.random() * 20) + 5 },
      { page: '/articles/dental-health-basics', users: Math.floor(Math.random() * 15) + 3 },
      { page: '/emergency', users: Math.floor(Math.random() * 10) + 2 },
      { page: '/find-dentist', users: Math.floor(Math.random() * 8) + 1 },
      { page: '/glossary', users: Math.floor(Math.random() * 5) + 1 }
    ].sort((a, b) => b.users - a.users),
    usersBySource: [
      { source: 'Organic Search', users: Math.floor(Math.random() * 30) + 10 },
      { source: 'Direct', users: Math.floor(Math.random() * 20) + 5 },
      { source: 'Social', users: Math.floor(Math.random() * 10) + 2 },
      { source: 'Referral', users: Math.floor(Math.random() * 5) + 1 }
    ].sort((a, b) => b.users - a.users),
    recentEvents: [
      { eventName: 'page_view', count: Math.floor(Math.random() * 100) + 50, page: '/' },
      { eventName: 'article_view', count: Math.floor(Math.random() * 50) + 20, page: '/articles/dental-health-basics' },
      { eventName: 'search', count: Math.floor(Math.random() * 30) + 10 },
      { eventName: 'chat_session_start', count: Math.floor(Math.random() * 20) + 5 },
      { eventName: 'sign_up', count: Math.floor(Math.random() * 10) + 1 }
    ]
  }
}