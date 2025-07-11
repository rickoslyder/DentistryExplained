'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArticleCommentThread } from '@/components/admin/article-comment-thread'
import { formatDistanceToNow } from 'date-fns'
import {
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Eye,
  Edit,
  ChevronRight,
} from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-auth'

interface ActiveUser {
  id: string
  name: string
  email: string
  image_url?: string
  status: 'viewing' | 'editing'
  last_seen: string
}

interface Comment {
  id: string
  article_id: string
  author_id: string
  content: string
  line_number?: number
  resolved: boolean
  created_at: string
  author?: {
    name: string
    image_url?: string
  }
}

interface CollaborativeSidebarProps {
  articleId: string
  currentUserId: string
}

export function CollaborativeSidebar({ articleId, currentUserId }: CollaborativeSidebarProps) {
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [selectedComment, setSelectedComment] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'users' | 'comments'>('comments')

  // Fetch active users
  const fetchActiveUsers = async () => {
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/active-users`)
      if (!response.ok) throw new Error('Failed to fetch active users')
      
      const data = await response.json()
      setActiveUsers(data.filter((user: ActiveUser) => user.id !== currentUserId))
    } catch (error) {
      console.error('Error fetching active users:', error)
    }
  }

  // Fetch comments summary
  const fetchCommentsSummary = async () => {
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/comments?summary=true`)
      if (!response.ok) throw new Error('Failed to fetch comments')
      
      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  useEffect(() => {
    fetchActiveUsers()
    fetchCommentsSummary()

    // Set up real-time subscriptions
    const supabase = createServerSupabaseClient()
    
    // Active users subscription
    const presenceChannel = supabase.channel(`article-presence:${articleId}`)
      .on('presence', { event: 'sync' }, () => {
        fetchActiveUsers()
      })
      .subscribe()

    // Comments subscription
    const commentsChannel = supabase.channel(`article-comments:${articleId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'article_comments',
        filter: `article_id=eq.${articleId}`
      }, () => {
        fetchCommentsSummary()
      })
      .subscribe()

    // Update user presence
    const updatePresence = async () => {
      await presenceChannel.track({
        user_id: currentUserId,
        status: 'viewing',
        last_seen: new Date().toISOString()
      })
    }
    
    updatePresence()
    const interval = setInterval(updatePresence, 30000) // Update every 30 seconds

    return () => {
      clearInterval(interval)
      supabase.removeChannel(presenceChannel)
      supabase.removeChannel(commentsChannel)
    }
  }, [articleId, currentUserId])

  const unresolvedCount = comments.filter(c => !c.resolved).length
  const resolvedCount = comments.filter(c => c.resolved).length

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Collaboration</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'users' | 'comments')}>
          <TabsList className="grid w-full grid-cols-2 rounded-none">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users ({activeUsers.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments ({comments.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="p-4">
            <ScrollArea className="h-[calc(100vh-300px)]">
              {activeUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No other users active</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeUsers.map(user => (
                    <div key={user.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image_url} />
                        <AvatarFallback>
                          {user.name?.charAt(0) || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.status === 'editing' ? 'default' : 'secondary'} className="text-xs">
                            {user.status === 'editing' ? (
                              <>
                                <Edit className="w-3 h-3 mr-1" />
                                Editing
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                Viewing
                              </>
                            )}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(user.last_seen), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="comments" className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span>{unresolvedCount} open</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{resolvedCount} resolved</span>
                  </div>
                </div>
              </div>
              
              <ScrollArea className="h-[calc(100vh-380px)]">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No comments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map(comment => (
                      <Button
                        key={comment.id}
                        variant="ghost"
                        className="w-full justify-start text-left p-3 h-auto"
                        onClick={() => setSelectedComment(comment.id)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={comment.author?.image_url} />
                            <AvatarFallback className="text-xs">
                              {comment.author?.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">
                                {comment.author?.name || 'Unknown'}
                              </span>
                              {comment.resolved ? (
                                <CheckCircle className="w-3 h-3 text-green-500" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-orange-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {comment.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {comment.line_number && (
                                <Badge variant="outline" className="text-xs">
                                  Line {comment.line_number}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
        
        {selectedComment && (
          <div className="absolute inset-0 bg-background z-10">
            <ArticleCommentThread
              articleId={articleId}
              lineNumber={comments.find(c => c.id === selectedComment)?.line_number}
              onClose={() => setSelectedComment(null)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}