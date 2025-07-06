'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Shield, 
  AlertTriangle, 
  RefreshCw, 
  Trash2,
  Users,
  Ban,
  Clock,
  Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { useCSRFContext } from '@/components/providers/csrf-provider'

interface RateLimitStats {
  totalRequests: number
  blockedRequests: number
  blockRate: string
  uniqueClients: number
  activeEntries: number
  heavyUsers: number
  topOffenders: Array<{
    key: string
    requests: number
    blocked: number
    firstRequest: string
    lastRequest: string
  }>
  memoryUsage: {
    entries: number
    estimatedMB: string
  }
}

export function RateLimitMonitor() {
  const [stats, setStats] = useState<RateLimitStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const { secureRequest } = useCSRFContext()

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/monitoring/rate-limits')
      if (!response.ok) throw new Error('Failed to fetch rate limit stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      toast.error('Failed to load rate limit statistics')
    } finally {
      setLoading(false)
    }
  }

  const clearAllLimits = async () => {
    if (!confirm('Are you sure you want to clear all rate limit data? This action cannot be undone.')) {
      return
    }

    setClearing(true)
    try {
      const response = await secureRequest('/api/admin/monitoring/rate-limits', {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to clear rate limits')

      toast.success('Rate limit data cleared successfully')
      await fetchStats()
    } catch (error) {
      toast.error('Failed to clear rate limit data')
    } finally {
      setClearing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!stats) return null

  const blockRateNumber = parseFloat(stats.blockRate)
  const isHighBlockRate = blockRateNumber > 10

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Rate Limit Monitor</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of API rate limiting
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={clearAllLimits}
            disabled={clearing}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Alert for high block rate */}
      {isHighBlockRate && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            High block rate detected ({stats.blockRate}). Consider investigating the top offenders below.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Since last restart
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
            <Ban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blockedRequests.toLocaleString()}</div>
            <Progress 
              value={blockRateNumber} 
              className={`h-2 mt-2 ${isHighBlockRate ? 'bg-red-100' : ''}`}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {stats.blockRate} block rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueClients.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeEntries} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heavy Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.heavyUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.memoryUsage.estimatedMB} MB memory
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Offenders */}
      {stats.topOffenders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Offenders</CardTitle>
            <CardDescription>
              Clients with the most blocked requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Blocked</TableHead>
                  <TableHead className="text-right">Block Rate</TableHead>
                  <TableHead>First Seen</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topOffenders.map((offender) => {
                  const blockRate = offender.requests > 0 
                    ? ((offender.blocked / offender.requests) * 100).toFixed(1)
                    : '0'
                  const isHighOffender = parseFloat(blockRate) > 50

                  return (
                    <TableRow key={offender.key}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm">{offender.key}</code>
                          {isHighOffender && (
                            <Badge variant="destructive" className="text-xs">
                              High Risk
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{offender.requests}</TableCell>
                      <TableCell className="text-right">{offender.blocked}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={isHighOffender ? 'destructive' : 'secondary'}>
                          {blockRate}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-sm">
                            {new Date(offender.firstRequest).toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-sm">
                            {new Date(offender.lastRequest).toLocaleTimeString()}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}