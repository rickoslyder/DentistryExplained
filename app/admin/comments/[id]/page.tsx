import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import Link from 'next/link'
import { 
  ArrowLeft, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown,
  Flag,
  Edit,
  Clock,
  FileText
} from 'lucide-react'

interface PageProps {
  params: {
    id: string
  }
}

async function getComment(id: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: comment, error } = await supabase
    .from('comments')
    .select(`
      *,
      articles (
        id,
        title,
        slug,
        author_id,
        created_at
      ),
      profiles (
        id,
        first_name,
        last_name,
        email,
        avatar_url,
        user_type
      ),
      comment_reactions (
        id,
        user_id,
        reaction_type
      ),
      comment_reports (
        id,
        reason,
        description,
        status,
        created_at,
        reporter:profiles!comment_reports_reporter_id_fkey (
          first_name,
          last_name,
          email
        )
      )
    `)
    .eq('id', id)
    .single()
  
  if (error || !comment) {
    return null
  }
  
  // Get replies if this is a parent comment
  const { data: replies } = await supabase
    .from('comments')
    .select(`
      *,
      profiles (
        id,
        first_name,
        last_name,
        email,
        avatar_url
      )
    `)
    .eq('parent_id', id)
    .order('created_at', { ascending: true })
  
  // Get parent comment if this is a reply
  let parentComment = null
  if (comment.parent_id) {
    const { data: parent } = await supabase
      .from('comments')
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .eq('id', comment.parent_id)
      .single()
    
    parentComment = parent
  }
  
  return {
    ...comment,
    replies: replies || [],
    parentComment
  }
}

export default async function CommentDetailsPage({ params }: PageProps) {
  const comment = await getComment(params.id)
  
  if (!comment) {
    notFound()
  }
  
  const getUserDisplay = (user: any) => {
    const name = user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.email || 'Unknown User'
    
    const initials = user?.first_name && user?.last_name
      ? `${user.first_name[0]}${user.last_name[0]}`
      : user?.email?.[0]?.toUpperCase() || '?'
    
    return { name, initials }
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
  
  const { name: userName, initials } = getUserDisplay(comment.profiles)
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/comments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Comments
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Comment Details</h1>
        </div>
        {getStatusBadge(comment.status)}
      </div>
      
      {/* Comment Info */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Comment Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Comment Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Parent Comment if this is a reply */}
            {comment.parentComment && (
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <p className="text-sm text-gray-500">In reply to:</p>
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.parentComment.profiles?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {getUserDisplay(comment.parentComment.profiles).initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {getUserDisplay(comment.parentComment.profiles).name}
                    </p>
                    <p className="text-sm mt-1">{comment.parentComment.content}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Comment */}
            <div className="flex items-start gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="font-medium">{userName}</p>
                  <p className="text-sm text-gray-500">{comment.profiles?.email}</p>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(comment.created_at), 'PPp')}
                  </span>
                  {comment.is_edited && (
                    <span className="flex items-center gap-1">
                      <Edit className="w-3 h-3" />
                      Edited {comment.edited_at && format(new Date(comment.edited_at), 'PPp')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Engagement Stats */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-green-600" />
                <span className="font-medium">{comment.upvotes}</span>
                <span className="text-sm text-gray-500">upvotes</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-red-600" />
                <span className="font-medium">{comment.downvotes}</span>
                <span className="text-sm text-gray-500">downvotes</span>
              </div>
            </div>
            
            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Replies ({comment.replies.length})
                </h4>
                <div className="space-y-3">
                  {comment.replies.map((reply: any) => {
                    const replyUser = getUserDisplay(reply.profiles)
                    return (
                      <div key={reply.id} className="flex items-start gap-3 pl-4 border-l-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={reply.profiles?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{replyUser.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{replyUser.name}</p>
                            {getStatusBadge(reply.status)}
                          </div>
                          <p className="text-sm mt-1">{reply.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(reply.created_at), 'PPp')}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Article Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Article
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link 
                href={`/articles/${comment.articles?.slug}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {comment.articles?.title}
              </Link>
              <p className="text-sm text-gray-500 mt-1">
                Published {comment.articles?.created_at && format(new Date(comment.articles.created_at), 'PP')}
              </p>
            </CardContent>
          </Card>
          
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{userName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{comment.profiles?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">User Type</p>
                <Badge variant="outline">
                  {comment.profiles?.user_type || 'patient'}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          {/* Reports */}
          {comment.comment_reports && comment.comment_reports.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-red-600">
                  <Flag className="w-4 h-4" />
                  Reports ({comment.comment_reports.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {comment.comment_reports.map((report: any) => (
                  <div key={report.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {report.reason}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {report.status}
                      </Badge>
                    </div>
                    {report.description && (
                      <p className="text-sm text-gray-600">{report.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      By {getUserDisplay(report.reporter).name} • {format(new Date(report.created_at), 'PP')}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}