'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { format } from 'date-fns'

interface Stats {
  total: number
  passed: number
  rejected: number
  reviewed: number
  avgProcessingTime: number
  topFlags: Array<{ type: string; count: number }>
  severityBreakdown: Record<string, number>
  trends: {
    daily: Array<{ date: string; total: number; rejected: number }>
    hourly: Array<{ hour: number; count: number }>
  }
}

export function ModerationStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('day')
  const { toast } = useToast()

  useEffect(() => {
    fetchStats()
  }, [timeframe])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/moderation/stats?timeframe=${timeframe}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load statistics',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getFlagTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      toxicity: 'Toxicity',
      hate_speech: 'Hate Speech',
      personal_info: 'Personal Info',
      medical_misinformation: 'Medical Misinfo',
      inappropriate_content: 'Inappropriate',
      off_topic: 'Off Topic'
    }
    return labels[type] || type
  }

  const getFlagTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-500',
      toxicity: 'bg-red-500',
      hate_speech: 'bg-red-700',
      personal_info: 'bg-purple-500',
      medical_misinformation: 'bg-orange-500',
      inappropriate_content: 'bg-pink-500',
      off_topic: 'bg-gray-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return <div>No statistics available</div>
  }

  const approvalRate = stats.total > 0 ? (stats.passed / stats.total) * 100 : 0
  const rejectionRate = stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Statistics Overview</h3>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hour">Last Hour</SelectItem>
            <SelectItem value="day">Last 24 Hours</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Content items moderated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvalRate.toFixed(1)}%</div>
            <Progress value={approvalRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectionRate.toFixed(1)}%</div>
            <Progress value={rejectionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProcessingTime}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Per content item
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Violation Types */}
      <Card>
        <CardHeader>
          <CardTitle>Top Violation Types</CardTitle>
          <CardDescription>Most common reasons for content flags</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topFlags.map((flag, idx) => {
              const percentage = stats.rejected > 0 ? (flag.count / stats.rejected) * 100 : 0
              return (
                <div key={flag.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getFlagTypeColor(flag.type)}`} />
                      <span className="font-medium">{getFlagTypeLabel(flag.type)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {flag.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Severity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Severity Distribution</CardTitle>
          <CardDescription>Breakdown of content by severity level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(stats.severityBreakdown).map(([severity, count]) => {
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div key={severity} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={
                      severity === 'critical' ? 'destructive' :
                      severity === 'high' ? 'default' :
                      severity === 'medium' ? 'secondary' :
                      'outline'
                    }>
                      {severity}
                    </Badge>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% of total
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Hourly Activity (if daily timeframe) */}
      {timeframe === 'day' && stats.trends?.hourly && (
        <Card>
          <CardHeader>
            <CardTitle>Hourly Activity</CardTitle>
            <CardDescription>Content moderation activity by hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.trends.hourly.map((hour) => {
                const maxCount = Math.max(...stats.trends.hourly.map(h => h.count))
                const percentage = maxCount > 0 ? (hour.count / maxCount) * 100 : 0
                
                return (
                  <div key={hour.hour} className="flex items-center gap-2">
                    <span className="text-sm w-12">{hour.hour}:00</span>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-4" />
                    </div>
                    <span className="text-sm w-12 text-right">{hour.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Trends (if week/month timeframe) */}
      {(timeframe === 'week' || timeframe === 'month') && stats.trends?.daily && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Trends</CardTitle>
            <CardDescription>Content moderation trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.trends.daily.slice(-7).map((day, idx) => {
                const prevDay = idx > 0 ? stats.trends.daily[idx - 1] : null
                const trend = prevDay ? day.total - prevDay.total : 0
                
                return (
                  <div key={day.date} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                    <span className="text-sm">{format(new Date(day.date), 'MMM d')}</span>
                    <div className="flex items-center gap-4">
                      <div className="text-sm">
                        <span className="font-medium">{day.total}</span>
                        <span className="text-muted-foreground"> total</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-red-600">{day.rejected}</span>
                        <span className="text-muted-foreground"> rejected</span>
                      </div>
                      <div className="flex items-center">
                        {trend > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : trend < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <Minus className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}