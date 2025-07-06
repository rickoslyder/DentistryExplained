'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, FileText, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  description?: string
}

function MetricCard({ title, value, change, changeLabel, icon, description }: MetricCardProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {change !== undefined && (
          <div className="flex items-center mt-2">
            {isPositive && <ArrowUpRight className="w-4 h-4 text-green-500" />}
            {isNegative && <ArrowDownRight className="w-4 h-4 text-red-500" />}
            <span className={cn(
              "text-xs font-medium ml-1",
              isPositive && "text-green-500",
              isNegative && "text-red-500",
              !isPositive && !isNegative && "text-gray-500"
            )}>
              {Math.abs(change)}% {changeLabel || 'from last period'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface RevenueMetricsProps {
  data: {
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
}

export function RevenueMetrics({ data }: RevenueMetricsProps) {
  // Calculate estimated monthly revenue
  const estimatedMonthlyRevenue = 
    (data.adRevenuePotential.pageviews * 0.002) + // £0.002 per pageview (£2 CPM)
    (data.professionalConversions.value * 29.99) // £29.99 per professional subscription

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Est. Monthly Revenue"
        value={`£${estimatedMonthlyRevenue.toFixed(2)}`}
        change={12}
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        description="Based on current metrics"
      />
      
      <MetricCard
        title="Ad Revenue Potential"
        value={`£${data.adRevenuePotential.value.toFixed(2)}`}
        change={data.adRevenuePotential.change}
        icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        description={`${data.adRevenuePotential.pageviews.toLocaleString()} pageviews`}
      />
      
      <MetricCard
        title="Professional Conversions"
        value={data.professionalConversions.value}
        change={data.professionalConversions.change}
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        description={`${data.professionalConversions.verificationRate}% verification rate`}
      />
      
      <MetricCard
        title="Active Users"
        value={data.userMetrics.activeUsers.toLocaleString()}
        change={data.userMetrics.change}
        icon={<Users className="h-4 w-4 text-muted-foreground" />}
        description={`${data.userMetrics.professionalUsers} professionals`}
      />
    </div>
  )
}