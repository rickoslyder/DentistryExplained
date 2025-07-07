'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { format } from 'date-fns'
import { AlertCircle, RefreshCw, Search, Filter, Activity } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface ActivityLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string | null
  resource_name: string | null
  ip_address: string | null
  user_agent: string | null
  metadata: any
  created_at: string
  profiles: {
    name: string | null
    email: string | null
  }
}

export function ActivityLogsMonitor() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [resourceTypeFilter, setResourceTypeFilter] = useState('all')
  const { toast } = useToast()
  // Using the global supabase client

  useEffect(() => {
    fetchLogs()

    // Set up real-time subscription
    const channel = supabase
      .channel('activity-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs'
        },
        (payload) => {
          // Fetch the new log with user info
          fetchSingleLog(payload.new.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchSingleLog = async (logId: string) => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        profiles (
          name,
          email
        )
      `)
      .eq('id', logId)
      .single()

    if (!error && data) {
      setLogs(prev => [data, ...prev])
    }
  }

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('activity_logs')
        .select(`
          *,
          profiles (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      // Apply filters
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter)
      }

      if (resourceTypeFilter !== 'all') {
        query = query.eq('resource_type', resourceTypeFilter)
      }

      if (searchQuery) {
        query = query.or(`resource_name.ilike.%${searchQuery}%,ip_address.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) {
        toast({
          title: 'Error fetching logs',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      setLogs(data || [])
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800'
      case 'update':
        return 'bg-blue-100 text-blue-800'
      case 'delete':
        return 'bg-red-100 text-red-800'
      case 'login':
        return 'bg-purple-100 text-purple-800'
      case 'logout':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'article':
        return '📄'
      case 'user':
        return '👤'
      case 'settings':
        return '⚙️'
      case 'category':
        return '📁'
      case 'glossary_term':
        return '📚'
      default:
        return '📋'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Real-time activity monitoring across the platform
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by resource name or IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={actionFilter} onValueChange={(value) => {
              setActionFilter(value)
              fetchLogs()
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resourceTypeFilter} onValueChange={(value) => {
              setResourceTypeFilter(value)
              fetchLogs()
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All resources</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="settings">Settings</SelectItem>
                <SelectItem value="category">Categories</SelectItem>
                <SelectItem value="glossary_term">Glossary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activity Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.profiles?.name || 'Unknown'}</div>
                        <div className="text-muted-foreground">{log.profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)} variant="secondary">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getResourceIcon(log.resource_type)}</span>
                        <div>
                          <div className="font-medium">{log.resource_type}</div>
                          {log.resource_name && (
                            <div className="text-sm text-muted-foreground">
                              {log.resource_name}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="cursor-pointer">
                          <summary className="text-sm text-muted-foreground">
                            View metadata
                          </summary>
                          <pre className="mt-2 text-xs">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.ip_address || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {logs.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activity logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}