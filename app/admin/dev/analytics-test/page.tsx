import { RealtimeMetrics } from '@/components/admin/analytics/realtime-metrics'

export default function TestAnalyticsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">GA4 Real-Time Analytics Test</h1>
      <RealtimeMetrics useGA4={true} />
    </div>
  )
}