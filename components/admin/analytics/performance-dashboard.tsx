'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Database, 
  Download, 
  Globe, 
  HardDrive, 
  RefreshCw, 
  Server, 
  TrendingDown, 
  TrendingUp, 
  Zap 
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'

interface PerformanceMetric {
  timestamp: Date
  value: number
  label?: string
}

interface PerformanceData {
  pageLoad: {
    current: number
    average: number
    p95: number
    trend: number
    history: PerformanceMetric[]
  }
  serverResponse: {
    current: number
    average: number
    p95: number
    trend: number
    history: PerformanceMetric[]
  }
  databaseQueries: {
    current: number
    average: number
    slowQueries: number
    history: PerformanceMetric[]
  }
  cacheHitRate: {
    current: number
    average: number
    trend: number
    history: PerformanceMetric[]
  }
  errorRate: {
    current: number
    average: number
    trend: number
    errors: Array<{
      type: string
      count: number
      lastOccurred: Date
    }>
  }
  infrastructure: {
    cpu: number
    memory: number
    disk: number
    bandwidth: number
  }
  coreWebVitals: {
    lcp: { value: number, rating: 'good' | 'needs-improvement' | 'poor' }
    fid: { value: number, rating: 'good' | 'needs-improvement' | 'poor' }
    cls: { value: number, rating: 'good' | 'needs-improvement' | 'poor' }
    ttfb: { value: number, rating: 'good' | 'needs-improvement' | 'poor' }
  }
}

export function PerformanceDashboard() {
  const [timeRange, setTimeRange] = useState('24h')
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<PerformanceData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch performance data
  useEffect(() => {
    async function fetchData() {
      try {
        setError(null)
        const response = await fetch(`/api/analytics/performance?range=${timeRange}`)
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Please log in to view performance metrics')
          }
          throw new Error(`Failed to fetch performance data: ${response.status}`)
        }
        
        const performanceData = await response.json()
        setData(performanceData)
      } catch (error) {
        console.error('Error fetching performance data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load performance data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    
    // Auto-refresh every 30 seconds
    const interval = autoRefresh ? setInterval(fetchData, 30000) : null
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [timeRange, autoRefresh])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No performance data available</p>
      </div>
    )
  }

  const getMetricStatus = (current: number, average: number, isLowerBetter: boolean = true) => {
    const threshold = average * (isLowerBetter ? 1.2 : 0.8)
    if (isLowerBetter) {
      return current > threshold ? 'critical' : current > average ? 'warning' : 'healthy'
    } else {
      return current < threshold ? 'critical' : current < average ? 'warning' : 'healthy'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const formatMetric = (value: number, type: 'time' | 'percentage' | 'count' = 'time') => {
    switch (type) {
      case 'time': return value < 1000 ? `${value.toFixed(2)}ms` : `${(value / 1000).toFixed(2)}s`
      case 'percentage': return `${value.toFixed(1)}%`
      case 'count': return value.toLocaleString()
    }
  }

  const formatTrend = (trend: number, isLowerBetter: boolean = true) => {
    const formattedTrend = Math.abs(trend).toFixed(2)
    const isImprovement = isLowerBetter ? trend < 0 : trend > 0
    const icon = trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
    const color = isImprovement ? 'text-green-600' : 'text-red-600'
    
    return {
      value: formattedTrend,
      icon,
      color,
      isImprovement
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-gray-600">Real-time application performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Page Load Time</span>
              <Clock className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMetric(data.pageLoad.current)}</div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
              <span>Avg: {formatMetric(data.pageLoad.average)}</span>
              <div className="flex items-center gap-1">
                <Badge 
                  variant="outline" 
                  className={`${formatTrend(data.pageLoad.trend).color}`}
                  title={`${formatTrend(data.pageLoad.trend).value}% vs average over ${timeRange}`}
                >
                  {formatTrend(data.pageLoad.trend).icon}
                  {formatTrend(data.pageLoad.trend).value}%
                </Badge>
              </div>
            </div>
            <Progress 
              value={(data.pageLoad.average / data.pageLoad.p95) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">P95: {formatMetric(data.pageLoad.p95)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Server Response</span>
              <Server className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMetric(data.serverResponse.current)}</div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
              <span>Avg: {formatMetric(data.serverResponse.average)}</span>
              <div className="flex items-center gap-1">
                <Badge 
                  variant="outline" 
                  className={`${formatTrend(data.serverResponse.trend).color}`}
                  title={`${formatTrend(data.serverResponse.trend).value}% vs average over ${timeRange}`}
                >
                  {formatTrend(data.serverResponse.trend).icon}
                  {formatTrend(data.serverResponse.trend).value}%
                </Badge>
              </div>
            </div>
            <Progress 
              value={(data.serverResponse.average / data.serverResponse.p95) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">P95: {formatMetric(data.serverResponse.p95)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Cache Hit Rate</span>
              <Zap className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMetric(data.cacheHitRate.current, 'percentage')}</div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
              <span>Avg: {formatMetric(data.cacheHitRate.average, 'percentage')}</span>
              <div className="flex items-center gap-1">
                <Badge 
                  variant="outline" 
                  className={`${formatTrend(data.cacheHitRate.trend, false).color}`}
                  title={`${formatTrend(data.cacheHitRate.trend, false).value}% vs average over ${timeRange}`}
                >
                  {formatTrend(data.cacheHitRate.trend, false).icon}
                  {formatTrend(data.cacheHitRate.trend, false).value}%
                </Badge>
              </div>
            </div>
            <Progress 
              value={data.cacheHitRate.current} 
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">Higher is better</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Error Rate</span>
              <AlertTriangle className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(getMetricStatus(data.errorRate.current, data.errorRate.average))}`}>
              {formatMetric(data.errorRate.current, 'percentage')}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
              <span>Avg: {formatMetric(data.errorRate.average, 'percentage')}</span>
              <div className="flex items-center gap-1">
                <Badge 
                  variant="outline" 
                  className={`${formatTrend(data.errorRate.trend).color}`}
                  title={`${formatTrend(data.errorRate.trend).value}% vs average over ${timeRange}`}
                >
                  {formatTrend(data.errorRate.trend).icon}
                  {formatTrend(data.errorRate.trend).value}%
                </Badge>
              </div>
            </div>
            <Progress 
              value={Math.min(data.errorRate.current * 10, 100)} 
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">Lower is better</p>
          </CardContent>
        </Card>
      </div>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
          <CardDescription>Google's key metrics for user experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">LCP (Largest Contentful Paint)</span>
                <Badge variant={data.coreWebVitals.lcp.rating === 'good' ? 'default' : data.coreWebVitals.lcp.rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
                  {data.coreWebVitals.lcp.rating}
                </Badge>
              </div>
              <div className="text-2xl font-bold">{formatMetric(data.coreWebVitals.lcp.value)}</div>
              <div className="text-xs text-gray-600">Target: &lt; 2.5s</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">FID (First Input Delay)</span>
                <Badge variant={data.coreWebVitals.fid.rating === 'good' ? 'default' : data.coreWebVitals.fid.rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
                  {data.coreWebVitals.fid.rating}
                </Badge>
              </div>
              <div className="text-2xl font-bold">{formatMetric(data.coreWebVitals.fid.value)}</div>
              <div className="text-xs text-gray-600">Target: &lt; 100ms</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CLS (Cumulative Layout Shift)</span>
                <Badge variant={data.coreWebVitals.cls.rating === 'good' ? 'default' : data.coreWebVitals.cls.rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
                  {data.coreWebVitals.cls.rating}
                </Badge>
              </div>
              <div className="text-2xl font-bold">{data.coreWebVitals.cls.value.toFixed(3)}</div>
              <div className="text-xs text-gray-600">Target: &lt; 0.1</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">TTFB (Time to First Byte)</span>
                <Badge variant={data.coreWebVitals.ttfb.rating === 'good' ? 'default' : data.coreWebVitals.ttfb.rating === 'needs-improvement' ? 'secondary' : 'destructive'}>
                  {data.coreWebVitals.ttfb.rating}
                </Badge>
              </div>
              <div className="text-2xl font-bold">{formatMetric(data.coreWebVitals.ttfb.value)}</div>
              <div className="text-xs text-gray-600">Target: &lt; 800ms</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics Tabs */}
      <Tabs defaultValue="response-times" className="w-full">
        <TabsList>
          <TabsTrigger value="response-times">Response Times</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="response-times" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Time Trends</CardTitle>
              <CardDescription>Page load and server response times over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.pageLoad.history.map((item, index) => ({
                      time: format(item.timestamp, 'HH:mm'),
                      pageLoad: item.value,
                      serverResponse: data.serverResponse.history[index]?.value || 0,
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis tickFormatter={(value) => `${value}ms`} />
                    <Tooltip 
                      formatter={(value: number) => `${value}ms`}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="pageLoad" 
                      stroke="#3b82f6" 
                      name="Page Load"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="serverResponse" 
                      stroke="#10b981" 
                      name="Server Response"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Performance</CardTitle>
              <CardDescription>Query performance and optimization opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{formatMetric(data.databaseQueries.current)}</div>
                    <p className="text-sm text-gray-600">Avg Query Time</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{data.databaseQueries.slowQueries}</div>
                    <p className="text-sm text-gray-600">Slow Queries</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{formatMetric(data.cacheHitRate.current, 'percentage')}</div>
                    <p className="text-sm text-gray-600">Cache Hit Rate</p>
                  </div>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.databaseQueries.history.map(item => ({
                        time: format(item.timestamp, 'HH:mm'),
                        queryTime: item.value,
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis tickFormatter={(value) => `${value}ms`} />
                      <Tooltip formatter={(value: number) => `${value}ms`} />
                      <Area 
                        type="monotone" 
                        dataKey="queryTime" 
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Infrastructure Health</CardTitle>
              <CardDescription>Server resource utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center">
                        <Cpu className="h-4 w-4 mr-2" />
                        CPU Usage
                      </span>
                      <span className="text-sm">{formatMetric(data.infrastructure.cpu, 'percentage')}</span>
                    </div>
                    <Progress value={data.infrastructure.cpu} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center">
                        <Database className="h-4 w-4 mr-2" />
                        Memory Usage
                      </span>
                      <span className="text-sm">{formatMetric(data.infrastructure.memory, 'percentage')}</span>
                    </div>
                    <Progress value={data.infrastructure.memory} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center">
                        <HardDrive className="h-4 w-4 mr-2" />
                        Disk Usage
                      </span>
                      <span className="text-sm">{formatMetric(data.infrastructure.disk, 'percentage')}</span>
                    </div>
                    <Progress value={data.infrastructure.disk} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Bandwidth Usage
                      </span>
                      <span className="text-sm">{formatMetric(data.infrastructure.bandwidth, 'percentage')}</span>
                    </div>
                    <Progress value={data.infrastructure.bandwidth} />
                  </div>
                </div>

                {data.infrastructure.cpu > 80 || data.infrastructure.memory > 80 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      High resource utilization detected. Consider scaling your infrastructure.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Analysis</CardTitle>
              <CardDescription>Application errors and their frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.errorRate.errors.map(error => ({
                        type: error.type,
                        count: error.count,
                      }))}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Recent Errors</h4>
                  {data.errorRate.errors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{error.type}</p>
                        <p className="text-sm text-gray-600">
                          Last occurred: {format(error.lastOccurred, 'MMM dd, HH:mm')}
                        </p>
                      </div>
                      <Badge variant="destructive">{error.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Performance Report
        </Button>
      </div>
    </div>
  )
}