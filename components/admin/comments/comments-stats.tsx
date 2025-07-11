'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  MessageSquare, 
  ThumbsUp, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Users
} from 'lucide-react'
import { createClientSupabaseClient } from '@/lib/supabase'

interface CommentStats {
  totalComments: number
  pendingComments: number
  approvedComments: number
  flaggedComments: number
  totalUsers: number
  totalReports: number
  pendingReports: number
  averageVotes: number
}

export function CommentsStats() {
  const [stats, setStats] = useState<CommentStats>({
    totalComments: 0,
    pendingComments: 0,
    approvedComments: 0,
    flaggedComments: 0,
    totalUsers: 0,
    totalReports: 0,
    pendingReports: 0,
    averageVotes: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch comment counts by status
      const { data: comments } = await supabase
        .from('comments')
        .select('status, upvotes, downvotes, user_id')
      
      // Fetch report counts
      const { data: reports } = await supabase
        .from('comment_reports')
        .select('status')
      
      if (comments) {
        const stats = {
          totalComments: comments.length,
          pendingComments: comments.filter(c => c.status === 'pending').length,
          approvedComments: comments.filter(c => c.status === 'approved').length,
          flaggedComments: comments.filter(c => c.status === 'flagged').length,
          totalUsers: new Set(comments.map(c => c.user_id)).size,
          totalReports: reports?.length || 0,
          pendingReports: reports?.filter(r => r.status === 'pending').length || 0,
          averageVotes: comments.length > 0 
            ? comments.reduce((sum, c) => sum + c.upvotes - c.downvotes, 0) / comments.length
            : 0
        }
        
        setStats(stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const approvalRate = stats.totalComments > 0 
    ? Math.round((stats.approvedComments / stats.totalComments) * 100)
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalComments}</div>
          <div className="text-xs text-muted-foreground mt-1">
            From {stats.totalUsers} users
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingComments}</div>
          <Progress 
            value={(stats.pendingComments / Math.max(stats.totalComments, 1)) * 100} 
            className="h-2 mt-2"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {stats.pendingReports} pending reports
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{approvalRate}%</div>
          <Progress 
            value={approvalRate} 
            className="h-2 mt-2"
          />
          <div className="text-xs text-muted-foreground mt-1">
            {stats.approvedComments} approved
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageVotes.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Average net votes per comment
          </div>
        </CardContent>
      </Card>
    </div>
  )
}