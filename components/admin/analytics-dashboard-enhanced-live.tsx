'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'
import { RevenueMetricsLive } from './analytics/revenue-metrics-live'
import { ProfessionalFunnelLive } from './analytics/professional-funnel-live'
import { ContentPerformanceLive } from './analytics/content-performance-live'
import { RealtimeMetrics } from './analytics/realtime-metrics'
import { AnalyticsDashboard as BasicDashboard } from './analytics-dashboard'

interface EnhancedAnalyticsDashboardLiveProps {
  initialData?: any
  defaultDays?: number
}

export function EnhancedAnalyticsDashboardLive({ initialData, defaultDays = 7 }: EnhancedAnalyticsDashboardLiveProps) {
  const [timeRange, setTimeRange] = useState(defaultDays.toString())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setRefreshKey(prev => prev + 1)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analytics/export?days=${timeRange}&format=csv`)
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export analytics data')
    }
  }

  const days = parseInt(timeRange)

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue & KPIs</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="basic">Basic Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Revenue Metrics */}
          <RevenueMetricsLive 
            key={`revenue-${refreshKey}`}
            initialData={initialData?.revenueMetrics} 
            days={days} 
          />
          
          {/* Professional Funnel and Content Performance */}
          <div className="grid gap-6 lg:grid-cols-3">
            <ProfessionalFunnelLive 
              key={`funnel-${refreshKey}`}
              initialData={initialData?.funnelData} 
              days={days} 
            />
            <div className="lg:col-span-1">
              <ContentPerformanceLive 
                key={`content-${refreshKey}`}
                initialData={initialData?.contentPerformance?.slice(0, 5)} 
                days={days} 
                limit={5}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Detailed Revenue Analysis */}
          <RevenueMetricsLive 
            key={`revenue-detail-${refreshKey}`}
            initialData={initialData?.revenueMetrics} 
            days={days} 
          />
          <ProfessionalFunnelLive 
            key={`funnel-detail-${refreshKey}`}
            initialData={initialData?.funnelData} 
            days={days} 
          />
          <ContentPerformanceLive 
            key={`content-detail-${refreshKey}`}
            initialData={initialData?.contentPerformance} 
            days={days} 
            limit={20}
          />
        </TabsContent>

        <TabsContent value="realtime">
          <RealtimeMetrics />
        </TabsContent>

        <TabsContent value="basic">
          <BasicDashboard data={initialData?.basicData} defaultDays={days} />
        </TabsContent>
      </Tabs>
    </div>
  )
}