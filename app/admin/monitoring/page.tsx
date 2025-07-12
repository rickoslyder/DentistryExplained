import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RateLimitMonitor } from '@/components/admin/rate-limit-monitor'
import { ActivityLogsMonitor } from '@/components/admin/activity-logs-monitor'
import { PerformanceMonitor } from '@/components/admin/performance-monitor'
import { ErrorTracker } from '@/components/admin/error-tracker'
import { ErrorAnalysisEnhanced } from '@/components/admin/error-analysis-enhanced'

export const dynamic = 'force-dynamic'

export default function MonitoringPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Monitoring</h1>
        <p className="text-muted-foreground">
          Monitor system health, performance, and security metrics
        </p>
      </div>

      <Tabs defaultValue="rate-limits" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rate-limits">Rate Limits</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Tracking</TabsTrigger>
          <TabsTrigger value="error-analysis">Error Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="rate-limits">
          <RateLimitMonitor />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityLogsMonitor />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value="errors">
          <ErrorTracker />
        </TabsContent>

        <TabsContent value="error-analysis">
          <ErrorAnalysisEnhanced />
        </TabsContent>
      </Tabs>
    </div>
  )
}