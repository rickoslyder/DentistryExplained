'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  Check,
  X,
  MoreVertical,
  Reply,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  User,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

interface Author {
  id: string
  name: string
  email: string
  image_url?: string
}

interface Comment {
  id: string
  article_id: string
  revision_id?: string
  author_id: string
  content: string
  line_number?: number
  selection_start?: number
  selection_end?: number
  resolved: boolean
  resolved_by?: string
  resolved_at?: string
  parent_comment_id?: string
  created_at: string
  updated_at: string
  author?: Author
  resolved_by_user?: Author
  replies?: Comment[]
}

interface ArticleCommentThreadProps {
  articleId: string
  revisionId?: string
  lineNumber?: number
  onClose?: () => void
}

export function ArticleCommentThread({
  articleId,
  revisionId,
  lineNumber,
  onClose
}: ArticleCommentThreadProps) {
  const { user } = useUser()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')

  // Fetch comments
  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/comments?${new URLSearchParams({
        ...(revisionId && { revision_id: revisionId }),
        ...(lineNumber !== undefined && { line_number: lineNumber.toString() })
      })}`)
      
      if (!response.ok) throw new Error('Failed to fetch comments')
      
      const data = await response.json()
      setComments(organizeComments(data))
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast.error('Failed to load comments')
    }
  }

  // Organize comments into threads
  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []
    
    // First pass: create map
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })
    
    // Second pass: organize into tree
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!
      if (comment.parent_comment_id) {
        const parent = commentMap.get(comment.parent_comment_id)
        if (parent) {
          parent.replies!.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })
    
    return rootComments
  }

  useEffect(() => {
    fetchComments()
    
    // Set up real-time subscription
    const supabase = createServerSupabaseClient()
    const channel = supabase
      .channel(`article-comments:${articleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'article_comments',
        filter: `article_id=eq.${articleId}`
      }, () => {
        fetchComments()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [articleId, revisionId, lineNumber])

  // Add new comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          revision_id: revisionId,
          line_number: lineNumber
        })
      })
      
      if (!response.ok) throw new Error('Failed to add comment')
      
      setNewComment('')
      toast.success('Comment added')
      fetchComments()
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setIsLoading(false)
    }
  }

  // Add reply
  const handleAddReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parent_comment_id: parentId,
          revision_id: revisionId
        })
      })
      
      if (!response.ok) throw new Error('Failed to add reply')
      
      setReplyContent('')
      setReplyingTo(null)
      toast.success('Reply added')
      fetchComments()
    } catch (error) {
      toast.error('Failed to add reply')
    } finally {
      setIsLoading(false)
    }
  }

  // Update comment
  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      })
      
      if (!response.ok) throw new Error('Failed to update comment')
      
      setEditingComment(null)
      setEditContent('')
      toast.success('Comment updated')
      fetchComments()
    } catch (error) {
      toast.error('Failed to update comment')
    } finally {
      setIsLoading(false)
    }
  }

  // Resolve/unresolve comment
  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved })
      })
      
      if (!response.ok) throw new Error('Failed to update comment')
      
      toast.success(resolved ? 'Comment resolved' : 'Comment reopened')
      fetchComments()
    } catch (error) {
      toast.error('Failed to update comment')
    } finally {
      setIsLoading(false)
    }
  }

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/comments/${commentId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete comment')
      
      toast.success('Comment deleted')
      fetchComments()
    } catch (error) {
      toast.error('Failed to delete comment')
    } finally {
      setIsLoading(false)
    }
  }

  // Render comment
  const renderComment = (comment: Comment, isReply = false) => {
    const isAuthor = user?.id === comment.author?.id
    const isEditing = editingComment === comment.id
    const isReplying = replyingTo === comment.id
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-12' : ''} mb-4`}>
        <div className={`flex gap-3 ${comment.resolved ? 'opacity-60' : ''}`}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author?.image_url} />
            <AvatarFallback>
              {comment.author?.name?.charAt(0) || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.author?.name || 'Unknown User'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
                {comment.resolved && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!comment.parent_comment_id && (
                    <DropdownMenuItem onClick={() => handleResolveComment(comment.id, !comment.resolved)}>
                      {comment.resolved ? (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          Reopen
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Resolve
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {isAuthor && (
                    <>
                      <DropdownMenuItem onClick={() => {
                        setEditingComment(comment.id)
                        setEditContent(comment.content)
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateComment(comment.id)}
                    disabled={isLoading}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null)
                      setEditContent('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                {!comment.resolved && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 px-2"
                    onClick={() => {
                      setReplyingTo(comment.id)
                      setReplyContent('')
                    }}
                  >
                    <Reply className="w-3 h-3 mr-1" />
                    Reply
                  </Button>
                )}
              </>
            )}
            
            {isReplying && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddReply(comment.id)}
                    disabled={isLoading || !replyContent.trim()}
                  >
                    Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null)
                      setReplyContent('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Comments</CardTitle>
            {lineNumber !== undefined && (
              <CardDescription>Line {lineNumber}</CardDescription>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm mt-2">Be the first to comment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => renderComment(comment))}
            </div>
          )}
        </ScrollArea>
        
        <div className="mt-4 space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="min-h-[80px]"
          />
          <Button
            onClick={handleAddComment}
            disabled={isLoading || !newComment.trim()}
            className="w-full"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Add Comment
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}