import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RateLimitMonitor } from '@/components/admin/rate-limit-monitor'

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
          <TabsTrigger value="activity" disabled>Activity Logs</TabsTrigger>
          <TabsTrigger value="performance" disabled>Performance</TabsTrigger>
          <TabsTrigger value="errors" disabled>Error Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="rate-limits">
          <RateLimitMonitor />
        </TabsContent>

        <TabsContent value="activity">
          <div className="text-center py-12 text-muted-foreground">
            Activity log monitoring coming soon...
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="text-center py-12 text-muted-foreground">
            Performance monitoring coming soon...
          </div>
        </TabsContent>

        <TabsContent value="errors">
          <div className="text-center py-12 text-muted-foreground">
            Error tracking coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}