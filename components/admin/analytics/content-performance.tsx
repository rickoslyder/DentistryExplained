'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Clock, Eye } from 'lucide-react'

interface ContentItem {
  id: string
  title: string
  category: string
  views: number
  avgTimeOnPage: number
  scrollDepth: number
  engagementScore: number
  revenueValue: number
}

interface ContentPerformanceProps {
  data: ContentItem[]
}

export function ContentPerformance({ data }: ContentPerformanceProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'dental-problems': 'bg-red-100 text-red-800',
      'treatments': 'bg-blue-100 text-blue-800',
      'prevention': 'bg-green-100 text-green-800',
      'the-mouth': 'bg-purple-100 text-purple-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getEngagementColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Sort by revenue value (engagement * views)
  const sortedData = [...data].sort((a, b) => b.revenueValue - a.revenueValue)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Content Performance</CardTitle>
            <CardDescription>
              Top performing content by engagement and revenue potential
            </CardDescription>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Revenue Optimized
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead className="text-center">Views</TableHead>
              <TableHead className="text-center">Avg. Time</TableHead>
              <TableHead className="text-center">Scroll Depth</TableHead>
              <TableHead className="text-center">Engagement</TableHead>
              <TableHead className="text-right">Revenue Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium line-clamp-1">{item.title}</p>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs mt-1", getCategoryColor(item.category))}
                    >
                      {item.category}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span>{item.views.toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{formatTime(item.avgTimeOnPage)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Progress value={item.scrollDepth} className="w-16 h-2" />
                    <span className="text-xs text-muted-foreground">
                      {item.scrollDepth}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn("font-medium", getEngagementColor(item.engagementScore))}>
                    {item.engagementScore}%
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  £{item.revenueValue.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// Helper function that should be imported from lib/utils
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ')
}