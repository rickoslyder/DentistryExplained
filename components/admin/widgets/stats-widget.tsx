'use client'

import { WidgetWrapper } from './widget-wrapper'
import { useWidgetData } from '@/hooks/use-widget-data'
import type { WidgetComponentProps } from '@/lib/widgets/types'
import { TrendingUp, TrendingDown, Users, FileText, Eye, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsData {
  articles: {
    total: number
    published: number
    change: number
  }
  users: {
    total: number
    professionals: number
    change: number
  }
  views: {
    total: number
    trend: number[]
    change: number
  }
  activeSessions: {
    count: number
    change: number
  }
}

export function StatsWidget({ id, config, isEditing, onRemove }: WidgetComponentProps) {
  const { data, error, isLoading, refetch } = useWidgetData<StatsData>({
    fetchFn: async () => {
      const response = await fetch('/api/admin/dashboard/widgets/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    },
    refreshInterval: 60000, // Refresh every minute
  })

  const stats = [
    {
      label: 'Total Articles',
      value: data?.articles.total || 0,
      subValue: `${data?.articles.published || 0} published`,
      change: data?.articles.change || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Total Users',
      value: data?.users.total || 0,
      subValue: `${data?.users.professionals || 0} professionals`,
      change: data?.users.change || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Total Views',
      value: data?.views.total || 0,
      subValue: '30-day total',
      change: data?.views.change || 0,
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Active Sessions',
      value: data?.activeSessions.count || 0,
      subValue: 'Right now',
      change: data?.activeSessions.change || 0,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  return (
    <WidgetWrapper
      title={config.title}
      isEditing={isEditing}
      onRemove={onRemove}
      isLoading={isLoading}
      error={error}
    >
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const isPositive = stat.change >= 0
          const TrendIcon = isPositive ? TrendingUp : TrendingDown

          return (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <Icon className={cn('h-4 w-4', stat.color)} />
                </div>
                <div className="flex items-center text-xs">
                  <TrendIcon
                    className={cn(
                      'h-3 w-3 mr-1',
                      isPositive ? 'text-green-600' : 'text-red-600'
                    )}
                  />
                  <span
                    className={cn(
                      'font-medium',
                      isPositive ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {Math.abs(stat.change)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.subValue}</p>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            </div>
          )
        })}
      </div>
    </WidgetWrapper>
  )
}