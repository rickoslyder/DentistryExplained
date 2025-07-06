'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Activity, MessageSquare, FileText, Circle, RefreshCw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface GA4RealtimeData {
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

interface RealtimeMetricsProps {
  initialData?: GA4RealtimeData
  useGA4?: boolean
}

export function RealtimeMetrics({ initialData, useGA4 = true }: RealtimeMetricsProps) {
  const [data, setData] = useState<GA4RealtimeData>(initialData || {
    activeUsers: 0,
    usersByPage: [],
    usersBySource: [],
    recentEvents: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Fetch real-time data from GA4
  const fetchRealtimeData = async () => {
    if (!useGA4) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/analytics/ga4?type=realtime')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const realtimeData: GA4RealtimeData = await response.json()
      setData(realtimeData)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch real-time data:', error)
      toast.error('Failed to load real-time analytics')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch and periodic updates
  useEffect(() => {
    if (useGA4) {
      fetchRealtimeData()
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        fetchRealtimeData()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [useGA4])

  const getSourceColor = (source: string) => {
    const lowerSource = source.toLowerCase()
    if (lowerSource.includes('organic')) return 'bg-green-100 text-green-800'
    if (lowerSource.includes('direct')) return 'bg-blue-100 text-blue-800'
    if (lowerSource.includes('social')) return 'bg-purple-100 text-purple-800'
    if (lowerSource.includes('referral')) return 'bg-yellow-100 text-yellow-800'
    if (lowerSource.includes('paid')) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getEventIcon = (eventName: string) => {
    const name = eventName.toLowerCase()
    if (name.includes('chat')) return MessageSquare
    if (name.includes('page_view')) return FileText
    if (name.includes('sign_up') || name.includes('verification')) return Users
    return Activity
  }

  const formatPagePath = (path: string) => {
    // Clean up and format page paths
    if (path === '/' || path === '(not set)') return 'Home'
    return path.replace(/^\//g, '').replace(/[_-]/g, ' ').split('/').map(s => 
      s.charAt(0).toUpperCase() + s.slice(1)
    ).join(' › ')
  }

  return (
    <div className="grid gap-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Real-Time Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRealtimeData}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

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
            <div className="text-2xl font-bold">{data.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              users on site right now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {data.usersByPage[0] ? formatPagePath(data.usersByPage[0].page) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.usersByPage[0]?.users || 0} users viewing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {data.usersBySource[0]?.source || 'Direct'}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.usersBySource[0]?.users || 0} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Events/min</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.recentEvents.reduce((sum, event) => sum + event.count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total events</p>
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
              {data.usersByPage.length > 0 ? (
                data.usersByPage.slice(0, 5).map((item) => (
                  <div key={item.page} className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate max-w-[250px]">
                      {formatPagePath(item.page)}
                    </p>
                    <Badge variant="secondary">{item.users} users</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active page views
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentEvents.length > 0 ? (
                data.recentEvents.slice(0, 5).map((event, idx) => {
                  const Icon = getEventIcon(event.eventName)
                  return (
                    <div key={`${event.eventName}-${idx}`} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">
                          {event.eventName.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {event.count}
                      </Badge>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent events
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Traffic Sources
          </CardTitle>
          <CardDescription>
            Where your active users are coming from
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.usersBySource.length > 0 ? (
              data.usersBySource.map((source) => (
                <div key={source.source} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={cn(getSourceColor(source.source))} variant="secondary">
                        {source.source}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{source.users} users</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: `${(source.users / data.activeUsers) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No traffic data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}