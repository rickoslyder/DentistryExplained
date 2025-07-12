'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format } from 'date-fns'
import { 
  ChevronDown, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Eye,
  Copy,
  ExternalLink,
  Bug,
  RefreshCw
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface ErrorSample {
  id: string
  message: string
  stack_trace: string | null
  url: string | null
  user_agent: string | null
  created_at: string
  metadata: any
}

interface ErrorTypeAnalysis {
  error_type: string
  count: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  trend_percentage: number
  last_occurrence: string
  samples: ErrorSample[]
  affected_users: number
  affected_pages: string[]
}

export function ErrorAnalysisEnhanced() {
  const [errorAnalysis, setErrorAnalysis] = useState<ErrorTypeAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSample, setSelectedSample] = useState<ErrorSample | null>(null)
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchErrorAnalysis()
  }, [])

  const fetchErrorAnalysis = async () => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      // Get errors from last 24 hours
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const last48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

      // Fetch current period errors
      const { data: currentErrors, error: currentError } = await supabase
        .from('error_logs')
        .select('*')
        .gte('created_at', last24h)
        .order('created_at', { ascending: false })

      if (currentError) throw currentError

      // Fetch previous period for trend analysis
      const { data: previousErrors, error: previousError } = await supabase
        .from('error_logs')
        .select('error_type')
        .gte('created_at', last48h)
        .lt('created_at', last24h)

      if (previousError) throw previousError

      // Group and analyze errors
      const errorGroups = groupAndAnalyzeErrors(
        currentErrors || [], 
        previousErrors || []
      )

      setErrorAnalysis(errorGroups)
    } catch (error) {
      console.error('Error fetching error analysis:', error)
      toast({
        title: 'Error loading analysis',
        description: 'Failed to fetch error analysis data',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const groupAndAnalyzeErrors = (
    currentErrors: any[], 
    previousErrors: any[]
  ): ErrorTypeAnalysis[] => {
    // Group current errors by type
    const grouped = currentErrors.reduce((acc, error) => {
      if (!acc[error.error_type]) {
        acc[error.error_type] = {
          error_type: error.error_type,
          count: 0,
          samples: [],
          users: new Set(),
          pages: new Set(),
          last_occurrence: error.created_at,
        }
      }
      
      acc[error.error_type].count++
      
      // Keep up to 5 samples per error type
      if (acc[error.error_type].samples.length < 5) {
        acc[error.error_type].samples.push({
          id: error.id,
          message: error.message,
          stack_trace: error.stack_trace,
          url: error.url,
          user_agent: error.user_agent,
          created_at: error.created_at,
          metadata: error.metadata,
        })
      }
      
      if (error.user_id) acc[error.error_type].users.add(error.user_id)
      if (error.url) acc[error.error_type].pages.add(error.url)
      
      // Update last occurrence
      if (new Date(error.created_at) > new Date(acc[error.error_type].last_occurrence)) {
        acc[error.error_type].last_occurrence = error.created_at
      }
      
      return acc
    }, {} as any)

    // Count previous period errors
    const previousCounts = previousErrors.reduce((acc, error) => {
      acc[error.error_type] = (acc[error.error_type] || 0) + 1
      return acc
    }, {} as any)

    // Calculate totals
    const totalErrors = currentErrors.length

    // Convert to array and calculate trends
    return Object.entries(grouped).map(([type, data]: [string, any]) => {
      const previousCount = previousCounts[type] || 0
      const currentCount = data.count
      
      let trend: 'up' | 'down' | 'stable' = 'stable'
      let trendPercentage = 0
      
      if (previousCount === 0 && currentCount > 0) {
        trend = 'up'
        trendPercentage = 100
      } else if (previousCount > 0) {
        const change = ((currentCount - previousCount) / previousCount) * 100
        trendPercentage = Math.abs(change)
        
        if (change > 5) trend = 'up'
        else if (change < -5) trend = 'down'
      }

      return {
        error_type: type,
        count: currentCount,
        percentage: totalErrors > 0 ? (currentCount / totalErrors) * 100 : 0,
        trend,
        trend_percentage: trendPercentage,
        last_occurrence: data.last_occurrence,
        samples: data.samples,
        affected_users: data.users.size,
        affected_pages: Array.from(data.pages).slice(0, 5),
      }
    }).sort((a, b) => b.count - a.count)
  }

  const getErrorTypeColor = (errorType: string) => {
    const colors: Record<string, string> = {
      'TypeError': 'bg-red-100 text-red-800 border-red-200',
      'NetworkError': 'bg-orange-100 text-orange-800 border-orange-200',
      'ValidationError': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ReferenceError': 'bg-purple-100 text-purple-800 border-purple-200',
      'SyntaxError': 'bg-pink-100 text-pink-800 border-pink-200',
      'RangeError': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    }
    return colors[errorType] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const toggleExpanded = (errorType: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(errorType)) {
      newExpanded.delete(errorType)
    } else {
      newExpanded.add(errorType)
    }
    setExpandedTypes(newExpanded)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to clipboard',
      duration: 2000,
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Error Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of errors by type with samples
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchErrorAnalysis}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {errorAnalysis.length === 0 ? (
            <div className="text-center py-12">
              <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No errors in the last 24 hours</p>
            </div>
          ) : (
            <div className="space-y-4">
              {errorAnalysis.map((analysis) => (
                <Collapsible
                  key={analysis.error_type}
                  open={expandedTypes.has(analysis.error_type)}
                  onOpenChange={() => toggleExpanded(analysis.error_type)}
                >
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge 
                              className={getErrorTypeColor(analysis.error_type)} 
                              variant="secondary"
                            >
                              {analysis.error_type}
                            </Badge>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold">{analysis.count}</span>
                              <span className="text-muted-foreground">
                                ({analysis.percentage.toFixed(1)}%)
                              </span>
                              {analysis.trend !== 'stable' && (
                                <div className="flex items-center gap-1">
                                  {analysis.trend === 'up' ? (
                                    <TrendingUp className="h-3 w-3 text-red-600" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-green-600" />
                                  )}
                                  <span className={`text-xs ${
                                    analysis.trend === 'up' ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {analysis.trend_percentage.toFixed(0)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right text-sm">
                              <div className="text-muted-foreground">Last seen</div>
                              <div className="font-medium">
                                {format(new Date(analysis.last_occurrence), 'HH:mm:ss')}
                              </div>
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${
                              expandedTypes.has(analysis.error_type) ? 'rotate-180' : ''
                            }`} />
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Affected users:</span>
                            <span className="ml-2 font-medium">{analysis.affected_users}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Error samples:</span>
                            <span className="ml-2 font-medium">{analysis.samples.length}</span>
                          </div>
                        </div>
                        
                        {analysis.affected_pages.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm text-muted-foreground mb-2">
                              Affected pages:
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {analysis.affected_pages.map((page, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {page}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="text-sm font-medium">Error Samples:</div>
                          {analysis.samples.map((sample, idx) => (
                            <div
                              key={sample.id}
                              className="border rounded-lg p-3 space-y-2 bg-muted/30"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-mono text-red-600 break-words">
                                    {sample.message}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span>{format(new Date(sample.created_at), 'HH:mm:ss')}</span>
                                    {sample.url && (
                                      <span className="truncate max-w-xs">{sample.url}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(sample.message)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedSample(sample)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample Details Dialog */}
      <Dialog open={!!selectedSample} onOpenChange={() => setSelectedSample(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error Sample Details</DialogTitle>
            <DialogDescription>
              Full error information and stack trace
            </DialogDescription>
          </DialogHeader>
          {selectedSample && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Error Message</h4>
                <p className="text-sm font-mono bg-muted p-3 rounded-md break-words">
                  {selectedSample.message}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Error Information</h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="font-medium text-muted-foreground">Time</dt>
                    <dd>{format(new Date(selectedSample.created_at), 'PPpp')}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">URL</dt>
                    <dd className="truncate">{selectedSample.url || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              {selectedSample.stack_trace && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">Stack Trace</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(selectedSample.stack_trace!)}
                    >
                      <Copy className="h-3 w-3 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <ScrollArea className="h-64 w-full rounded-md border">
                    <pre className="text-xs p-3">
                      {selectedSample.stack_trace}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              {selectedSample.metadata && Object.keys(selectedSample.metadata).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Additional Metadata</h4>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(selectedSample.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedSample.user_agent && (
                <div>
                  <h4 className="font-semibold mb-2">User Agent</h4>
                  <p className="text-sm bg-muted p-3 rounded-md">{selectedSample.user_agent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}