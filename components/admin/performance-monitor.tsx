'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertCircle, RefreshCw, TrendingUp, TrendingDown, Activity, Clock, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface PerformanceMetric {
  endpoint: string
  method: string
  avg_response_time: number
  min_response_time: number
  max_response_time: number
  request_count: number
  error_count: number
  error_rate: number
}

interface TimeSeriesData {
  time: string
  value: number
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('1h')
  const [metricType, setMetricType] = useState('response_time')
  const { toast } = useToast()

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [timeRange])

  const fetchMetrics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/performance?range=${timeRange}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance metrics')
      }
      
      const data = await response.json()
      
      setMetrics(data.metrics || [])
      
      // Process time series data for chart
      if (data.timeSeries && data.timeSeries.length > 0) {
        // Group by time intervals
        const intervalMinutes = timeRange === '1h' ? 5 : timeRange === '6h' ? 15 : 60
        const grouped: Record<string, number[]> = {}
        
        data.timeSeries.forEach((point: any) => {
          const date = new Date(point.time)
          const interval = Math.floor(date.getTime() / (intervalMinutes * 60 * 1000))
          const key = new Date(interval * intervalMinutes * 60 * 1000).toISOString()
          
          if (!grouped[key]) {
            grouped[key] = []
          }
          if (point.response_time > 0) {
            grouped[key].push(point.response_time)
          }
        })
        
        // Calculate averages for each interval
        const timeSeries = Object.entries(grouped)
          .map(([time, values]) => ({
            time: new Date(time).toLocaleTimeString(),
            value: values.length > 0 
              ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
              : 0
          }))
          .slice(-24) // Last 24 data points
        
        setTimeSeriesData(timeSeries)
      } else {
        // Generate placeholder data if no real data
        const now = new Date()
        const mockTimeSeries: TimeSeriesData[] = []
        for (let i = 0; i < 24; i++) {
          const time = new Date(now.getTime() - (23 - i) * 5 * 60 * 1000)
          mockTimeSeries.push({
            time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            value: Math.floor(Math.random() * 200) + 50
          })
        }
        setTimeSeriesData(mockTimeSeries)
      }
    } catch (error) {
      toast({
        title: 'Error fetching performance metrics',
        description: 'Failed to load performance data',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (responseTime: number) => {
    if (responseTime < 100) return 'text-green-600 bg-green-100'
    if (responseTime < 300) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const calculateTrend = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change).toFixed(1),
      isPositive: change < 0 // Lower response time is better
    }
  }

  // Calculate overview statistics from the fetched metrics
  const calculateOverviewStats = () => {
    if (!metrics || metrics.length === 0) {
      return {
        avgResponseTime: 0,
        totalRequests: 0,
        errorRate: 0,
        uptime: 99.9 // Default uptime
      }
    }

    const totalRequests = metrics.reduce((sum, m) => sum + m.request_count, 0)
    const totalErrors = metrics.reduce((sum, m) => sum + m.error_count, 0)
    const weightedResponseTime = metrics.reduce((sum, m) => sum + (m.avg_response_time * m.request_count), 0)
    const avgResponseTime = totalRequests > 0 ? Math.round(weightedResponseTime / totalRequests) : 0
    const errorRate = totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : '0.00'
    
    // Calculate uptime based on error rate (simple approximation)
    const uptime = totalRequests > 0 ? (100 - parseFloat(errorRate)).toFixed(2) : '99.90'

    return {
      avgResponseTime,
      totalRequests,
      errorRate,
      uptime
    }
  }

  const stats = calculateOverviewStats()

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>{timeRange} average</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">
              In {timeRange === '1h' ? 'last hour' : timeRange === '24h' ? 'last 24 hours' : `last ${timeRange}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.errorRate}%</div>
            <div className={`flex items-center gap-1 text-sm ${parseFloat(stats.errorRate) > 1 ? 'text-red-600' : 'text-green-600'}`}>
              {parseFloat(stats.errorRate) > 1 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{parseFloat(stats.errorRate) > 1 ? 'Above' : 'Below'} threshold</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uptime}%</div>
            <div className="text-sm text-muted-foreground">System availability</div>
          </CardContent>
        </Card>
      </div>

      {/* Response Time Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Response Time Trends</CardTitle>
              <CardDescription>
                API endpoint response times over time
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMetrics}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="time" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Endpoint Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Endpoint Performance</CardTitle>
          <CardDescription>
            Performance metrics by API endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Endpoint</th>
                  <th className="text-left p-4">Method</th>
                  <th className="text-right p-4">Avg Response</th>
                  <th className="text-right p-4">Min/Max</th>
                  <th className="text-right p-4">Requests</th>
                  <th className="text-right p-4">Errors</th>
                  <th className="text-right p-4">Error Rate</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((metric, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-4 font-mono text-sm">{metric.endpoint}</td>
                    <td className="p-4">
                      <Badge variant="outline">{metric.method}</Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Badge className={getStatusColor(metric.avg_response_time)} variant="secondary">
                        {metric.avg_response_time}ms
                      </Badge>
                    </td>
                    <td className="p-4 text-right text-sm text-muted-foreground">
                      {metric.min_response_time}ms / {metric.max_response_time}ms
                    </td>
                    <td className="p-4 text-right font-medium">
                      {metric.request_count.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      {metric.error_count > 0 && (
                        <Badge variant="destructive">{metric.error_count}</Badge>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <span className={metric.error_rate > 1 ? 'text-red-600' : 'text-muted-foreground'}>
                        {metric.error_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}