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
      // In a real implementation, this would fetch from a performance monitoring API
      // For now, we'll generate mock data
      const mockMetrics: PerformanceMetric[] = [
        {
          endpoint: '/api/chat',
          method: 'POST',
          avg_response_time: 245,
          min_response_time: 120,
          max_response_time: 890,
          request_count: 1234,
          error_count: 12,
          error_rate: 0.97
        },
        {
          endpoint: '/api/search',
          method: 'GET',
          avg_response_time: 89,
          min_response_time: 45,
          max_response_time: 234,
          request_count: 5678,
          error_count: 5,
          error_rate: 0.09
        },
        {
          endpoint: '/api/articles',
          method: 'GET',
          avg_response_time: 67,
          min_response_time: 32,
          max_response_time: 145,
          request_count: 3456,
          error_count: 2,
          error_rate: 0.06
        },
        {
          endpoint: '/api/admin/dashboard/layout',
          method: 'GET',
          avg_response_time: 134,
          min_response_time: 89,
          max_response_time: 234,
          request_count: 234,
          error_count: 0,
          error_rate: 0
        }
      ]

      // Generate time series data
      const now = new Date()
      const mockTimeSeries: TimeSeriesData[] = []
      for (let i = 0; i < 24; i++) {
        const time = new Date(now.getTime() - (23 - i) * 5 * 60 * 1000)
        mockTimeSeries.push({
          time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          value: Math.floor(Math.random() * 200) + 50
        })
      }

      setMetrics(mockMetrics)
      setTimeSeriesData(mockTimeSeries)
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
            <div className="text-2xl font-bold">145ms</div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingDown className="h-3 w-3" />
              <span>-12.3%</span>
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
            <div className="text-2xl font-bold">10,802</div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="h-3 w-3" />
              <span>+23.5%</span>
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
            <div className="text-2xl font-bold">0.23%</div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingDown className="h-3 w-3" />
              <span>-0.05%</span>
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
            <div className="text-2xl font-bold">99.98%</div>
            <div className="text-sm text-muted-foreground">Last 30 days</div>
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