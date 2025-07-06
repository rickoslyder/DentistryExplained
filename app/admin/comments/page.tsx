import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default function CommentsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Comments</h1>
        <p className="text-gray-600 mt-1">Manage user comments and feedback</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The comments system has not been implemented yet. This feature will allow users to:
          </p>
          <ul className="mt-4 list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Comment on articles</li>
            <li>Reply to other comments</li>
            <li>Report inappropriate content</li>
            <li>Receive notifications for replies</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            As an admin, you'll be able to moderate comments, manage spam, and view analytics.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}