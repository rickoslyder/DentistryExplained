'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { 
  AlertTriangle, 
  Shield, 
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClientSupabaseClient } from '@/lib/supabase'

interface CommentReport {
  id: string
  comment_id: string
  reporter_id: string
  reason: string
  description: string | null
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  comments: {
    id: string
    content: string
    status: string
    user_id: string
    profiles: {
      first_name: string | null
      last_name: string | null
      email: string
    }
  }
  reporter: {
    first_name: string | null
    last_name: string | null
    email: string
    avatar_url: string | null
  }
  reviewer?: {
    first_name: string | null
    last_name: string | null
    email: string
  }
}

export function CommentsReports() {
  const [reports, setReports] = useState<CommentReport[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [selectedReport, setSelectedReport] = useState<CommentReport | null>(null)
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    fetchReports()

    // Set up real-time subscription
    const channel = supabase
      .channel('comment-reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comment_reports'
        },
        () => {
          // Refresh reports when any change occurs
          fetchReports()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [statusFilter])

  const fetchReports = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('comment_reports')
        .select(`
          *,
          comments (
            id,
            content,
            status,
            user_id,
            profiles (first_name, last_name, email)
          ),
          reporter:profiles!comment_reports_reporter_id_fkey (
            first_name,
            last_name,
            email,
            avatar_url
          ),
          reviewer:profiles!comment_reports_reviewed_by_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setReports(data || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateReportStatus = async (reportId: string, status: string, commentAction?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error: reportError } = await supabase
        .from('comment_reports')
        .update({ 
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (reportError) throw reportError

      // If a comment action is specified, update the comment status
      if (commentAction && selectedReport) {
        const { error: commentError } = await supabase
          .from('comments')
          .update({ status: commentAction })
          .eq('id', selectedReport.comment_id)

        if (commentError) throw commentError
      }

      toast({
        title: 'Success',
        description: `Report ${status}`,
      })
      
      setSelectedReport(null)
      fetchReports()
    } catch (error) {
      console.error('Error updating report:', error)
      toast({
        title: 'Error',
        description: 'Failed to update report',
        variant: 'destructive'
      })
    }
  }

  const getReasonBadge = (reason: string) => {
    const variants: Record<string, any> = {
      spam: { className: 'bg-gray-100 text-gray-800' },
      inappropriate: { className: 'bg-orange-100 text-orange-800' },
      harassment: { className: 'bg-red-100 text-red-800' },
      misinformation: { className: 'bg-yellow-100 text-yellow-800' },
      other: { className: 'bg-blue-100 text-blue-800' }
    }
    
    return (
      <Badge variant="secondary" className={variants[reason]?.className}>
        {reason}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      reviewed: { variant: 'default', className: 'bg-blue-100 text-blue-800' },
      resolved: { variant: 'default', className: 'bg-green-100 text-green-800' },
      dismissed: { variant: 'secondary', className: 'bg-gray-100 text-gray-800' }
    }
    
    return (
      <Badge variant={variants[status]?.variant} className={variants[status]?.className}>
        {status}
      </Badge>
    )
  }

  const getUserDisplay = (user: any) => {
    if (!user) return { name: 'Unknown', initials: '?' }
    
    const name = user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.email || 'Unknown'
    
    const initials = user.first_name && user.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`
      : user.email?.[0]?.toUpperCase() || '?'
    
    return { name, initials }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Comment Reports</CardTitle>
              <CardDescription>
                Review and handle reported comments
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reports</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReports}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Comment Author</TableHead>
                  <TableHead>Comment Preview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No reports found
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => {
                    const reporter = getUserDisplay(report.reporter)
                    const commentAuthor = getUserDisplay(report.comments?.profiles)
                    
                    return (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={report.reporter?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">{reporter.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{reporter.name}</p>
                              <p className="text-xs text-gray-500">{report.reporter?.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getReasonBadge(report.reason)}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{commentAuthor.name}</p>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-sm line-clamp-2">{report.comments?.content}</p>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(report.status)}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-500">
                            {format(new Date(report.created_at), 'MMM d, yyyy')}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Report Details Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
            <DialogDescription>
              Review the reported comment and take appropriate action
            </DialogDescription>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-4">
              {/* Report Info */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Report Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Reason</p>
                    <p>{getReasonBadge(selectedReport.reason)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Reported on</p>
                    <p>{format(new Date(selectedReport.created_at), 'PPp')}</p>
                  </div>
                </div>
                {selectedReport.description && (
                  <div>
                    <p className="text-gray-500 text-sm">Additional details</p>
                    <p className="text-sm mt-1">{selectedReport.description}</p>
                  </div>
                )}
              </div>

              {/* Comment Content */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Reported Comment</h4>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getUserDisplay(selectedReport.comments?.profiles).initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {getUserDisplay(selectedReport.comments?.profiles).name}
                        </p>
                        <p className="text-sm mt-1">{selectedReport.comments?.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Previous Reviews */}
              {selectedReport.reviewer && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Review History</h4>
                  <p className="text-sm text-gray-500">
                    Reviewed by {getUserDisplay(selectedReport.reviewer).name} on{' '}
                    {selectedReport.reviewed_at && format(new Date(selectedReport.reviewed_at), 'PPp')}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => updateReportStatus(selectedReport!.id, 'dismissed')}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Dismiss Report
            </Button>
            <Button
              variant="default"
              onClick={() => updateReportStatus(selectedReport!.id, 'resolved', 'flagged')}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Flag Comment
            </Button>
            <Button
              variant="destructive"
              onClick={() => updateReportStatus(selectedReport!.id, 'resolved', 'rejected')}
            >
              <Shield className="w-4 h-4 mr-2" />
              Remove Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}