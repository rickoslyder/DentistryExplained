'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnhancedAnalyticsDashboardLive } from '@/components/admin/analytics-dashboard-enhanced-live'
import { PostHogRealtimeAnalytics } from '@/components/admin/analytics/posthog-realtime'
import { PerformanceDashboard } from '@/components/admin/analytics/performance-dashboard'

interface AnalyticsPageClientProps {
  enhancedData: any
  defaultDays: number
}

export function AnalyticsPageClient({ enhancedData, defaultDays }: AnalyticsPageClientProps) {
  return (
    <Tabs defaultValue="business" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="business">Business Analytics</TabsTrigger>
        <TabsTrigger value="posthog">PostHog Analytics</TabsTrigger>
        <TabsTrigger value="performance">Performance Monitoring</TabsTrigger>
      </TabsList>

      <TabsContent value="business" className="space-y-4">
        <EnhancedAnalyticsDashboardLive initialData={enhancedData} defaultDays={defaultDays} />
      </TabsContent>

      <TabsContent value="posthog" className="space-y-4">
        <div className="p-6 bg-white rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">PostHog Real-time Analytics</h2>
          <p className="text-gray-600 mb-6">Privacy-first product analytics and feature flags</p>
          <PostHogRealtimeAnalytics />
        </div>
      </TabsContent>

      <TabsContent value="performance" className="space-y-4">
        <div className="p-6 bg-white rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Application Performance</h2>
          <p className="text-gray-600 mb-6">Monitor Core Web Vitals, server performance, and infrastructure health</p>
          <PerformanceDashboard />
        </div>
      </TabsContent>
    </Tabs>
  )
}