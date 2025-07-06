'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  CalendarDays, 
  Clock, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Ban
} from 'lucide-react'
import { format, parseISO, isBefore, isAfter, addHours } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ScheduledArticle {
  id: string
  article_id: string
  scheduled_at: string
  status: 'pending' | 'processing' | 'published' | 'failed' | 'cancelled'
  created_at: string
  published_at?: string
  error_message?: string
}

interface ArticleSchedulingProps {
  articleId: string
  articleStatus: string
  currentScheduledAt?: string | null
  onScheduleUpdate?: (scheduledAt: Date | null) => void
}

export function ArticleScheduling({ 
  articleId, 
  articleStatus,
  currentScheduledAt,
  onScheduleUpdate 
}: ArticleSchedulingProps) {
  const [isScheduled, setIsScheduled] = useState(!!currentScheduledAt)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    currentScheduledAt ? parseISO(currentScheduledAt) : undefined
  )
  const [selectedTime, setSelectedTime] = useState<string>(
    currentScheduledAt ? format(parseISO(currentScheduledAt), 'HH:mm') : '09:00'
  )
  const [loading, setLoading] = useState(false)
  const [schedule, setSchedule] = useState<ScheduledArticle | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Generate time options in 30-minute intervals
  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2)
    const minute = i % 2 === 0 ? '00' : '30'
    return `${hour.toString().padStart(2, '0')}:${minute}`
  })

  // Fetch current schedule if exists
  useEffect(() => {
    if (currentScheduledAt) {
      fetchSchedule()
    }
  }, [articleId])

  const fetchSchedule = async () => {
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/schedule`)
      if (response.ok) {
        const data = await response.json()
        if (data.schedule) {
          setSchedule(data.schedule)
          setIsScheduled(true)
          setSelectedDate(parseISO(data.schedule.scheduled_at))
          setSelectedTime(format(parseISO(data.schedule.scheduled_at), 'HH:mm'))
        }
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
    }
  }

  const handleScheduleToggle = (checked: boolean) => {
    if (!checked && schedule?.status === 'pending') {
      // Show confirmation dialog for canceling
      setShowCancelDialog(true)
    } else {
      setIsScheduled(checked)
      if (!checked) {
        setSelectedDate(undefined)
        onScheduleUpdate?.(null)
      }
    }
  }

  const handleScheduleSave = async () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time')
      return
    }

    // Combine date and time
    const [hours, minutes] = selectedTime.split(':').map(Number)
    const scheduledAt = new Date(selectedDate)
    scheduledAt.setHours(hours, minutes, 0, 0)

    // Validate schedule time
    if (isBefore(scheduledAt, new Date())) {
      toast.error('Scheduled time must be in the future')
      return
    }

    // Minimum 1 hour in the future
    if (isBefore(scheduledAt, addHours(new Date(), 1))) {
      toast.error('Schedule time must be at least 1 hour from now')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: scheduledAt.toISOString() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to schedule article')
      }

      const data = await response.json()
      setSchedule(data.schedule)
      onScheduleUpdate?.(scheduledAt)
      toast.success('Article scheduled successfully')
    } catch (error) {
      console.error('Schedule error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to schedule article')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSchedule = async () => {
    if (!schedule) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/schedule`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to cancel schedule')
      }

      setSchedule(null)
      setIsScheduled(false)
      setSelectedDate(undefined)
      onScheduleUpdate?.(null)
      toast.success('Schedule cancelled successfully')
    } catch (error) {
      console.error('Cancel error:', error)
      toast.error('Failed to cancel schedule')
    } finally {
      setLoading(false)
      setShowCancelDialog(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'published':
        return <CheckCircle2 className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'cancelled':
        return <Ban className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default'
      case 'processing':
        return 'secondary'
      case 'published':
        return 'success'
      case 'failed':
        return 'destructive'
      case 'cancelled':
        return 'outline'
      default:
        return 'default'
    }
  }

  // Only allow scheduling for draft articles
  const canSchedule = articleStatus === 'draft'

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Schedule Publication
          </CardTitle>
          <CardDescription>
            Schedule this article to be published automatically at a future date and time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canSchedule ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Only draft articles can be scheduled for publication
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="schedule-toggle">Enable Scheduling</Label>
                  <p className="text-sm text-muted-foreground">
                    Schedule this article to publish automatically
                  </p>
                </div>
                <Switch
                  id="schedule-toggle"
                  checked={isScheduled}
                  onCheckedChange={handleScheduleToggle}
                  disabled={loading}
                />
              </div>

              {isScheduled && (
                <>
                  {schedule && schedule.status !== 'pending' && (
                    <Alert>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(schedule.status)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Status: <Badge variant={getStatusColor(schedule.status) as any}>
                              {schedule.status}
                            </Badge>
                          </p>
                          {schedule.error_message && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Error: {schedule.error_message}
                            </p>
                          )}
                          {schedule.published_at && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Published: {format(parseISO(schedule.published_at), 'PPp')}
                            </p>
                          )}
                        </div>
                      </div>
                    </Alert>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Publication Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !selectedDate && 'text-muted-foreground'
                            )}
                            disabled={loading || (schedule?.status !== 'pending' && schedule?.status !== undefined)}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => isBefore(date, new Date())}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Publication Time</Label>
                      <Select
                        value={selectedTime}
                        onValueChange={setSelectedTime}
                        disabled={loading || (schedule?.status !== 'pending' && schedule?.status !== undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        Will be published on {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleScheduleSave}
                      disabled={loading || !selectedDate || (schedule?.status !== 'pending' && schedule?.status !== undefined)}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Schedule'
                      )}
                    </Button>
                    {schedule?.status === 'pending' && (
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelDialog(true)}
                        disabled={loading}
                      >
                        Cancel Schedule
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Scheduled Publication</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the scheduled publication? The article will remain in draft status.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Schedule
            </Button>
            <Button variant="destructive" onClick={handleCancelSchedule} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Schedule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}