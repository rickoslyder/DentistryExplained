import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommentsStats } from '@/components/admin/comments/comments-stats'
import { CommentsList } from '@/components/admin/comments/comments-list'
import { CommentsReports } from '@/components/admin/comments/comments-reports'

export default function CommentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comments Management</h1>
        <p className="text-gray-600 mt-1">Moderate user comments and handle reports</p>
      </div>
      
      {/* Stats Overview */}
      <CommentsStats />
      
      {/* Tabs for Comments and Reports */}
      <Tabs defaultValue="comments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comments">All Comments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comments">
          <CommentsList />
        </TabsContent>
        
        <TabsContent value="reports">
          <CommentsReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}