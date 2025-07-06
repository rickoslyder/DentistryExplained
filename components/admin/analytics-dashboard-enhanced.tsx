'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw } from 'lucide-react'
import { RevenueMetrics } from './analytics/revenue-metrics'
import { ProfessionalFunnel } from './analytics/professional-funnel'
import { ContentPerformance } from './analytics/content-performance'
import { RealtimeMetrics } from './analytics/realtime-metrics'
import { AnalyticsDashboard as BasicDashboard } from './analytics-dashboard'

interface AnalyticsData {
  // Revenue metrics data
  revenueMetrics: {
    adRevenuePotential: {
      value: number
      change: number
      pageviews: number
      avgEngagement: number
    }
    professionalConversions: {
      value: number
      change: number
      verificationRate: number
      avgTimeToConvert: number
    }
    userMetrics: {
      totalUsers: number
      activeUsers: number
      professionalUsers: number
      change: number
    }
    contentMetrics: {
      totalArticles: number
      publishedArticles: number
      avgReadTime: number
      change: number
    }
  }
  
  // Funnel data
  funnelData: {
    visitors: number
    signups: number
    verificationStarted: number
    verificationSubmitted: number
    verified: number
    activeSubscribers: number
  }
  
  // Content performance
  contentPerformance: Array<{
    id: string
    title: string
    category: string
    views: number
    avgTimeOnPage: number
    scrollDepth: number
    engagementScore: number
    revenueValue: number
  }>
  
  // Basic dashboard data (existing)
  basicData: any
}

interface EnhancedAnalyticsDashboardProps {
  data: AnalyticsData
  defaultDays?: number
}

export function EnhancedAnalyticsDashboard({ data, defaultDays = 7 }: EnhancedAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState(defaultDays.toString())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // In production, this would fetch fresh data
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const handleExport = () => {
    // Export analytics data as CSV
    const csvContent = `Dentistry Explained Analytics Report
Generated: ${new Date().toLocaleString()}
Time Range: Last ${timeRange} days

Revenue Metrics:
Est. Monthly Revenue,£${((data.revenueMetrics.adRevenuePotential.pageviews * 0.002) + (data.revenueMetrics.professionalConversions.value * 29.99)).toFixed(2)}
Ad Revenue Potential,£${data.revenueMetrics.adRevenuePotential.value.toFixed(2)}
Professional Conversions,${data.revenueMetrics.professionalConversions.value}
Active Users,${data.revenueMetrics.userMetrics.activeUsers}

Professional Funnel:
Visitors,${data.funnelData.visitors}
Signups,${data.funnelData.signups}
Verification Started,${data.funnelData.verificationStarted}
Verification Submitted,${data.funnelData.verificationSubmitted}
Verified,${data.funnelData.verified}
Active Subscribers,${data.funnelData.activeSubscribers}
`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
          <RevenueMetrics data={data.revenueMetrics} />
          
          {/* Professional Funnel and Content Performance */}
          <div className="grid gap-6 lg:grid-cols-3">
            <ProfessionalFunnel data={data.funnelData} />
            <div className="lg:col-span-1">
              <ContentPerformance data={data.contentPerformance.slice(0, 5)} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Detailed Revenue Analysis */}
          <RevenueMetrics data={data.revenueMetrics} />
          <ProfessionalFunnel data={data.funnelData} />
          <ContentPerformance data={data.contentPerformance} />
        </TabsContent>

        <TabsContent value="realtime">
          <RealtimeMetrics useGA4={true} />
        </TabsContent>

        <TabsContent value="basic">
          <BasicDashboard data={data.basicData} defaultDays={parseInt(timeRange)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}