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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { AlertCircle, RefreshCw, Search, Bug, TrendingUp, TrendingDown, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface ErrorLog {
  id: string
  error_type: string
  message: string
  stack_trace: string | null
  user_id: string | null
  url: string | null
  user_agent: string | null
  metadata: any
  created_at: string
  profiles?: {
    name: string | null
    email: string | null
  }
}

interface ErrorSummary {
  error_type: string
  count: number
  last_occurrence: string
  trend: 'up' | 'down' | 'stable'
}

export function ErrorTracker() {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [errorSummary, setErrorSummary] = useState<ErrorSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [errorTypeFilter, setErrorTypeFilter] = useState('all')
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)
  const { toast } = useToast()
  // Using the global supabase client

  useEffect(() => {
    if (!supabase) {
      console.error('Supabase client not initialized')
      return
    }
    
    fetchErrors()
    fetchErrorSummary()

    // Set up real-time subscription
    const channel = supabase
      .channel('error-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'error_logs'
        },
        (payload) => {
          // Add new error to the list
          fetchSingleError(payload.new.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchSingleError = async (errorId: string) => {
    if (!supabase) return
    
    const { data, error } = await supabase
      .from('error_logs')
      .select(`
        *,
        profiles (
          name,
          email
        )
      `)
      .eq('id', errorId)
      .single()

    if (!error && data) {
      setErrors(prev => [data, ...prev])
      // Update summary
      fetchErrorSummary()
    }
  }

  const fetchErrors = async () => {
    if (!supabase) {
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      let query = supabase
        .from('error_logs')
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
      if (errorTypeFilter !== 'all') {
        query = query.eq('error_type', errorTypeFilter)
      }

      if (searchQuery) {
        query = query.or(`message.ilike.%${searchQuery}%,url.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) {
        toast({
          title: 'Error fetching error logs',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      setErrors(data || [])
    } catch (error) {
      console.error('Error fetching error logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchErrorSummary = async () => {
    try {
      // In a real implementation, this would be an aggregated query
      // For now, we'll create mock summary data
      const mockSummary: ErrorSummary[] = [
        {
          error_type: 'TypeError',
          count: 45,
          last_occurrence: new Date().toISOString(),
          trend: 'up'
        },
        {
          error_type: 'NetworkError',
          count: 23,
          last_occurrence: new Date(Date.now() - 3600000).toISOString(),
          trend: 'down'
        },
        {
          error_type: 'ValidationError',
          count: 12,
          last_occurrence: new Date(Date.now() - 7200000).toISOString(),
          trend: 'stable'
        },
        {
          error_type: 'ReferenceError',
          count: 8,
          last_occurrence: new Date(Date.now() - 10800000).toISOString(),
          trend: 'down'
        }
      ]

      setErrorSummary(mockSummary)
    } catch (error) {
      console.error('Error fetching error summary:', error)
    }
  }

  const getErrorTypeColor = (errorType: string) => {
    switch (errorType) {
      case 'TypeError':
        return 'bg-red-100 text-red-800'
      case 'NetworkError':
        return 'bg-orange-100 text-orange-800'
      case 'ValidationError':
        return 'bg-yellow-100 text-yellow-800'
      case 'ReferenceError':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-red-600" />
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-green-600" />
    return <span className="h-4 w-4 text-gray-400">—</span>
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {errorSummary.map((summary) => (
          <Card key={summary.error_type}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{summary.error_type}</CardTitle>
                {getTrendIcon(summary.trend)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.count}</div>
              <p className="text-xs text-muted-foreground">
                Last: {format(new Date(summary.last_occurrence), 'MMM d, HH:mm')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Error List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                Track and analyze application errors
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchErrors()
                fetchErrorSummary()
              }}
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
                  placeholder="Search error messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchErrors()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={errorTypeFilter} onValueChange={(value) => {
              setErrorTypeFilter(value)
              fetchErrors()
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All error types</SelectItem>
                <SelectItem value="TypeError">TypeError</SelectItem>
                <SelectItem value="NetworkError">NetworkError</SelectItem>
                <SelectItem value="ValidationError">ValidationError</SelectItem>
                <SelectItem value="ReferenceError">ReferenceError</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errors.map((error) => (
                  <TableRow key={error.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(error.created_at), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getErrorTypeColor(error.error_type)} variant="secondary">
                        {error.error_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate">{error.message}</p>
                    </TableCell>
                    <TableCell>
                      {error.profiles ? (
                        <div className="text-sm">
                          <div className="font-medium">{error.profiles.name || 'Unknown'}</div>
                          <div className="text-muted-foreground">{error.profiles.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Anonymous</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {error.url && (
                        <p className="text-sm text-muted-foreground truncate">{error.url}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedError(error)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {errors.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No errors found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Details Dialog */}
      <Dialog open={!!selectedError} onOpenChange={() => setSelectedError(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Details</DialogTitle>
            <DialogDescription>
              Full error information and stack trace
            </DialogDescription>
          </DialogHeader>
          {selectedError && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Error Information</h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="font-medium text-muted-foreground">Type</dt>
                    <dd><Badge className={getErrorTypeColor(selectedError.error_type)} variant="secondary">{selectedError.error_type}</Badge></dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Time</dt>
                    <dd>{format(new Date(selectedError.created_at), 'PPpp')}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">User</dt>
                    <dd>{selectedError.profiles?.email || 'Anonymous'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">URL</dt>
                    <dd className="truncate">{selectedError.url || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Error Message</h4>
                <p className="text-sm bg-muted p-3 rounded-md">{selectedError.message}</p>
              </div>

              {selectedError.stack_trace && (
                <div>
                  <h4 className="font-semibold mb-2">Stack Trace</h4>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}

              {selectedError.metadata && Object.keys(selectedError.metadata).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Additional Metadata</h4>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(selectedError.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedError.user_agent && (
                <div>
                  <h4 className="font-semibold mb-2">User Agent</h4>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedError.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}