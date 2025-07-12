'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle, XCircle, AlertTriangle, Edit, Ban, Eye, User, Link, FileText, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'

interface ReviewItem {
  id: string
  contentId: string
  contentType: string
  content: string
  authorId: string
  authorName?: string
  authorReputation?: string
  moderationResult: {
    confidence: number
    severity: string
    flags: Array<{
      type: string
      reason: string
      confidence: number
    }>
    scores: Record<string, number>
  }
  status: string
  priority: string
  createdAt: string
  metadata?: any
}

export function ReviewQueue() {
  const [items, setItems] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [decision, setDecision] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [filter, setFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const { toast } = useToast()

  useEffect(() => {
    fetchItems()
  }, [filter, priorityFilter])

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('contentType', filter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      
      const response = await fetch(`/api/admin/moderation/queue?${params}`)
      if (!response.ok) throw new Error('Failed to fetch items')
      const data = await response.json()
      setItems(data.items)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load review queue',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReview = (item: ReviewItem) => {
    setSelectedItem(item)
    setReviewDialogOpen(true)
    setDecision('')
    setNotes('')
  }

  const submitReview = async () => {
    if (!selectedItem || !decision) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/moderation/review/${selectedItem.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes })
      })

      if (!response.ok) throw new Error('Failed to submit review')

      toast({
        title: 'Success',
        description: 'Review submitted successfully'
      })

      setReviewDialogOpen(false)
      fetchItems() // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare className="h-4 w-4" />
      case 'article': return <FileText className="h-4 w-4" />
      case 'chat_message': return <MessageSquare className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="comment">Comments</SelectItem>
            <SelectItem value="article">Articles</SelectItem>
            <SelectItem value="chat_message">Chat Messages</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">No items pending review</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getContentIcon(item.contentType)}
                      <CardTitle className="text-base">
                        {item.contentType.charAt(0).toUpperCase() + item.contentType.slice(1).replace('_', ' ')}
                      </CardTitle>
                      <Badge variant={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </div>
                    <CardDescription>
                      By {item.authorName || 'Unknown'} • {format(new Date(item.createdAt), 'PPp')}
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleReview(item)}>
                    Review
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Content Preview */}
                <div className="p-4 bg-muted rounded-lg">
                  <p className="line-clamp-3">{item.content}</p>
                </div>

                {/* Moderation Result */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Confidence: {(item.moderationResult.confidence * 100).toFixed(1)}%</span>
                    <span className={getSeverityColor(item.moderationResult.severity)}>
                      Severity: {item.moderationResult.severity}
                    </span>
                  </div>

                  {/* Flags */}
                  {item.moderationResult.flags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {item.moderationResult.flags.map((flag, idx) => (
                        <Badge key={idx} variant="outline">
                          {flag.type}: {flag.reason}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Author Info */}
                {item.authorReputation && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>User reputation: {item.authorReputation}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Content</DialogTitle>
            <DialogDescription>
              Make a decision about this content
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              {/* Content */}
              <div>
                <h4 className="font-medium mb-2">Content</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <p>{selectedItem.content}</p>
                </div>
              </div>

              {/* Moderation Details */}
              <div>
                <h4 className="font-medium mb-2">Moderation Analysis</h4>
                <Tabs defaultValue="flags">
                  <TabsList>
                    <TabsTrigger value="flags">Flags</TabsTrigger>
                    <TabsTrigger value="scores">Scores</TabsTrigger>
                  </TabsList>
                  <TabsContent value="flags">
                    <div className="space-y-2">
                      {selectedItem.moderationResult.flags.map((flag, idx) => (
                        <div key={idx} className="flex justify-between p-2 bg-muted rounded">
                          <span>{flag.type}</span>
                          <span className="text-sm text-muted-foreground">{flag.reason}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="scores">
                    <div className="space-y-2">
                      {Object.entries(selectedItem.moderationResult.scores).map(([key, value]) => (
                        <div key={key} className="flex justify-between p-2 bg-muted rounded">
                          <span>{key}</span>
                          <span>{(value * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Decision */}
              <div>
                <h4 className="font-medium mb-2">Decision</h4>
                <Select value={decision} onValueChange={setDecision}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a decision" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Approve
                      </div>
                    </SelectItem>
                    <SelectItem value="reject">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Reject
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4 text-yellow-600" />
                        Require Edit
                      </div>
                    </SelectItem>
                    <SelectItem value="warn">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        Warn User
                      </div>
                    </SelectItem>
                    <SelectItem value="ban">
                      <div className="flex items-center gap-2">
                        <Ban className="h-4 w-4 text-red-600" />
                        Ban User
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div>
                <h4 className="font-medium mb-2">Notes (Optional)</h4>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this decision..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={!decision || processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}