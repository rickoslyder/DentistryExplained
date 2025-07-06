'use client'

import { useState } from 'react'
import { WidgetWrapper } from './widget-wrapper'
import { useWidgetData } from '@/hooks/use-widget-data'
import type { WidgetComponentProps } from '@/lib/widgets/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'

interface UserGrowthData {
  daily: Array<{
    date: string
    patients: number
    professionals: number
    total: number
  }>
  weekly: Array<{
    date: string
    patients: number
    professionals: number
    total: number
  }>
  monthly: Array<{
    date: string
    patients: number
    professionals: number
    total: number
  }>
  stats: {
    totalUsers: number
    growthRate: number
    projection: number
  }
}

export function UserGrowthWidget({ id, config, isEditing, onRemove }: WidgetComponentProps) {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  
  const { data, error, isLoading, refetch } = useWidgetData<UserGrowthData>({
    fetchFn: async () => {
      const response = await fetch('/api/admin/dashboard/widgets/user-growth')
      if (!response.ok) throw new Error('Failed to fetch user growth data')
      return response.json()
    },
    refreshInterval: 300000, // Refresh every 5 minutes
  })

  const chartData = data?.[timeRange] || []

  const formatXAxis = (value: string) => {
    const date = new Date(value)
    switch (timeRange) {
      case 'daily':
        return format(date, 'MMM d')
      case 'weekly':
        return format(date, 'MMM d')
      case 'monthly':
        return format(date, 'MMM yyyy')
      default:
        return value
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white p-3 shadow-lg rounded border">
          <p className="font-medium mb-1">{formatXAxis(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <WidgetWrapper
      title={config.title}
      isEditing={isEditing}
      onRemove={onRemove}
      isLoading={isLoading}
      error={error}
      headerAction={
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-24 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      <div className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 pb-4 border-b">
          <div>
            <p className="text-2xl font-bold">{data?.stats.totalUsers || 0}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              +{data?.stats.growthRate || 0}%
            </p>
            <p className="text-xs text-muted-foreground">Growth Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {data?.stats.projection || 0}
            </p>
            <p className="text-xs text-muted-foreground">30-day Projection</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="patients"
                  name="Patients"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="professionals"
                  name="Professionals"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#6b7280"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No data available</p>
            </div>
          )}
        </div>
      </div>
    </WidgetWrapper>
  )
}