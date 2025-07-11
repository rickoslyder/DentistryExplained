'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { 
  MessageSquare, 
  MoreHorizontal, 
  Check, 
  X, 
  Flag, 
  Trash2, 
  Search,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  RefreshCw,
  Eye
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { createClientSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

interface Comment {
  id: string
  article_id: string
  user_id: string
  parent_id: string | null
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'flagged'
  is_edited: boolean
  edited_at: string | null
  upvotes: number
  downvotes: number
  created_at: string
  updated_at: string
  articles: {
    title: string
    slug: string
  }
  profiles: {
    first_name: string | null
    last_name: string | null
    email: string
    avatar_url: string | null
  }
  comment_reports: Array<{
    id: string
    reason: string
    status: string
  }>
}

interface CommentsListProps {
  initialComments?: Comment[]
}

export function CommentsList({ initialComments = [] }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const { toast } = useToast()
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    fetchComments()

    // Set up real-time subscription
    const channel = supabase
      .channel('comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        () => {
          // Refresh comments when any change occurs
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [statusFilter, sortBy])

  const fetchComments = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('comments')
        .select(`
          *,
          articles (title, slug),
          profiles (first_name, last_name, email, avatar_url),
          comment_reports (id, reason, status)
        `)
        .order(sortBy, { ascending: false })
        .limit(100)

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load comments',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const updateCommentStatus = async (commentId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ status })
        .eq('id', commentId)

      if (error) throw error

      toast({
        title: 'Success',
        description: `Comment ${status}`,
      })
      
      // Update local state
      setComments(prev => 
        prev.map(c => c.id === commentId ? { ...c, status: status as any } : c)
      )
    } catch (error) {
      console.error('Error updating comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to update comment status',
        variant: 'destructive'
      })
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Comment deleted',
      })
      
      // Update local state
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete comment',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' },
      approved: { variant: 'default', className: 'bg-green-100 text-green-800' },
      rejected: { variant: 'destructive', className: 'bg-red-100 text-red-800' },
      flagged: { variant: 'destructive', className: 'bg-orange-100 text-orange-800' }
    }
    
    return (
      <Badge variant={variants[status]?.variant} className={variants[status]?.className}>
        {status}
      </Badge>
    )
  }

  const getUserDisplay = (comment: Comment) => {
    const name = comment.profiles?.first_name && comment.profiles?.last_name
      ? `${comment.profiles.first_name} ${comment.profiles.last_name}`
      : comment.profiles?.email || 'Unknown User'
    
    const initials = comment.profiles?.first_name && comment.profiles?.last_name
      ? `${comment.profiles.first_name[0]}${comment.profiles.last_name[0]}`
      : comment.profiles?.email?.[0]?.toUpperCase() || '?'
    
    return { name, initials }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Comments Management</CardTitle>
            <CardDescription>
              Moderate and manage user comments across all articles
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchComments}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search comments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchComments()}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Newest first</SelectItem>
              <SelectItem value="upvotes">Most upvoted</SelectItem>
              <SelectItem value="downvotes">Most downvoted</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Comments Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Article</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Votes</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No comments found
                  </TableCell>
                </TableRow>
              ) : (
                comments.map((comment) => {
                  const { name, initials } = getUserDisplay(comment)
                  const hasReports = comment.comment_reports && comment.comment_reports.length > 0
                  
                  return (
                    <TableRow key={comment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{name}</p>
                            <p className="text-xs text-gray-500">{comment.profiles?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="space-y-1">
                          <p className="text-sm line-clamp-2">{comment.content}</p>
                          <div className="flex items-center gap-2">
                            {comment.parent_id && (
                              <Badge variant="outline" className="text-xs">
                                Reply
                              </Badge>
                            )}
                            {comment.is_edited && (
                              <Badge variant="outline" className="text-xs">
                                Edited
                              </Badge>
                            )}
                            {hasReports && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                {comment.comment_reports.length} report(s)
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {comment.articles && (
                          <Link
                            href={`/admin/articles/${comment.article_id}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {comment.articles.title}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(comment.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {comment.upvotes}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" />
                            {comment.downvotes}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-500">
                          {format(new Date(comment.created_at), 'MMM d, yyyy')}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/comments/${comment.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => updateCommentStatus(comment.id, 'approved')}
                              disabled={comment.status === 'approved'}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateCommentStatus(comment.id, 'rejected')}
                              disabled={comment.status === 'rejected'}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => updateCommentStatus(comment.id, 'flagged')}
                              disabled={comment.status === 'flagged'}
                            >
                              <Flag className="w-4 h-4 mr-2" />
                              Flag
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => deleteComment(comment.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
  )
}