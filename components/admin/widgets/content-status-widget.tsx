'use client'

import { WidgetWrapper } from './widget-wrapper'
import { useWidgetData } from '@/hooks/use-widget-data'
import type { WidgetComponentProps } from '@/lib/widgets/types'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useRouter } from 'next/navigation'

interface ContentStatusData {
  statusCounts: {
    published: number
    draft: number
    scheduled: number
    archived: number
  }
  total: number
}

const COLORS = {
  published: '#10b981',
  draft: '#f59e0b',
  scheduled: '#3b82f6',
  archived: '#6b7280',
}

export function ContentStatusWidget({ id, config, isEditing, onRemove }: WidgetComponentProps) {
  const router = useRouter()
  
  const { data, error, isLoading, refetch } = useWidgetData<ContentStatusData>({
    fetchFn: async () => {
      const response = await fetch('/api/admin/dashboard/widgets/content-status')
      if (!response.ok) throw new Error('Failed to fetch content status')
      return response.json()
    },
    refreshInterval: 60000, // Refresh every minute
  })

  const chartData = data ? [
    { name: 'Published', value: data.statusCounts.published, status: 'published' },
    { name: 'Draft', value: data.statusCounts.draft, status: 'draft' },
    { name: 'Scheduled', value: data.statusCounts.scheduled, status: 'scheduled' },
    { name: 'Archived', value: data.statusCounts.archived, status: 'archived' },
  ].filter(item => item.value > 0) : []

  const handleClick = (entry: any) => {
    if (entry && entry.status) {
      router.push(`/admin/articles?status=${entry.status}`)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0]
      return (
        <div className="bg-white p-2 shadow-lg rounded border">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} articles ({Math.round((data.value / (data.payload.total || 1)) * 100)}%)
          </p>
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
    >
      <div className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                onClick={handleClick}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.status as keyof typeof COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <text 
                x="50%" 
                y="50%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-3xl font-bold"
              >
                {data?.total || 0}
              </text>
              <text 
                x="50%" 
                y="50%" 
                dy={20} 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="text-sm text-muted-foreground"
              >
                Total
              </text>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No content yet</p>
          </div>
        )}
      </div>
      
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-4">
          {chartData.map((item) => (
            <button
              key={item.status}
              onClick={() => handleClick(item)}
              className="flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[item.status as keyof typeof COLORS] }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
              <span className="text-sm font-medium">{item.value}</span>
            </button>
          ))}
        </div>
      )}
    </WidgetWrapper>
  )
}