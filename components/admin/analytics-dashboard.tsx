'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Eye, 
  MessageSquare, 
  FileText,
  TrendingUp,
  Search,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface AnalyticsData {
  overview: {
    totalArticles: number
    totalUsers: number
    totalSessions: number
    totalViews: number
  }
  dailyViews: Array<{
    date: string
    views: number
  }>
  popularArticles: Array<{
    id: string
    title: string
    slug: string
    views: number
  }>
  recentActivity: Array<{
    id: string
    userEmail: string
    userType: string
    createdAt: string
  }>
  topSearches: Array<{
    term: string
    count: number
  }>
}

interface AnalyticsDashboardProps {
  data: AnalyticsData
  defaultDays: number
}

export function AnalyticsDashboard({ data, defaultDays }: AnalyticsDashboardProps) {
  const router = useRouter()
  const [days, setDays] = useState(defaultDays.toString())
  
  const handleDaysChange = (value: string) => {
    setDays(value)
    router.push(`/admin/analytics?days=${value}`)
  }
  
  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex justify-end">
        <Select value={days} onValueChange={handleDaysChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalArticles}</div>
            <p className="text-xs text-muted-foreground">Published content</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalSessions}</div>
            <p className="text-xs text-muted-foreground">AI conversations</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Article Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalViews}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Views Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Article Views Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyViews}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Popular Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.popularArticles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No article views yet
                    </TableCell>
                  </TableRow>
                ) : (
                  data.popularArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <Link 
                          href={`/${article.slug}`}
                          className="hover:underline"
                          target="_blank"
                        >
                          {article.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">{article.views}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Top Search Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Top Search Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Search Term</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topSearches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No searches recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  data.topSearches.map((search, index) => (
                    <TableRow key={index}>
                      <TableCell>{search.term}</TableCell>
                      <TableCell className="text-right">{search.count}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Chat Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentActivity.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No recent activity
                  </TableCell>
                </TableRow>
              ) : (
                data.recentActivity.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.userEmail}</TableCell>
                    <TableCell>
                      <Badge variant={activity.userType === 'professional' ? 'default' : 'secondary'}>
                        {activity.userType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}