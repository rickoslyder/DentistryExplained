'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  FileText,
  Shield,
  Upload,
  Download,
  Edit,
  Trash,
  LogIn,
  LogOut,
  UserCog,
  Settings,
  Eye,
  Globe,
  Smartphone,
} from 'lucide-react'

interface ActivityLog {
  id: string
  created_at: string
  user_id: string
  action: string
  resource_type: string
  resource_id?: string
  resource_name?: string
  metadata: Record<string, any>
  ip_address?: string
  user_agent?: string
  profiles: {
    full_name?: string
    email?: string
    image_url?: string
  }
}

interface ActivityLogsViewProps {
  logs: ActivityLog[]
  totalCount: number
  totalPages: number
  currentPage: number
  filters: {
    action?: string
    resource?: string
    user?: string
    date?: string
  }
  filterOptions: {
    actions: string[]
    resources: string[]
    users: Array<{ id: string; full_name?: string; email?: string }>
  }
}

const actionIcons: Record<string, React.ReactNode> = {
  create: <FileText className="w-4 h-4" />,
  update: <Edit className="w-4 h-4" />,
  delete: <Trash className="w-4 h-4" />,
  login: <LogIn className="w-4 h-4" />,
  logout: <LogOut className="w-4 h-4" />,
  role_change: <UserCog className="w-4 h-4" />,
  bulk_delete: <Trash className="w-4 h-4" />,
  upload: <Upload className="w-4 h-4" />,
  export: <Download className="w-4 h-4" />,
  view: <Eye className="w-4 h-4" />,
}

const actionColors: Record<string, string> = {
  create: 'default',
  update: 'secondary',
  delete: 'destructive',
  login: 'default',
  logout: 'outline',
  role_change: 'default',
  bulk_delete: 'destructive',
  upload: 'default',
  export: 'outline',
}

export function ActivityLogsView({
  logs,
  totalCount,
  totalPages,
  currentPage,
  filters,
  filterOptions,
}: ActivityLogsViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1') // Reset to first page when filtering
    router.push(`/admin/activity?${params.toString()}`)
  }

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/admin/activity?${params.toString()}`)
  }

  const getUserDisplay = (log: ActivityLog) => {
    const name = log.profiles?.full_name || log.profiles?.email || 'Unknown User'
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return { name, initials, image: log.profiles?.image_url }
  }

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return null
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="w-3 h-3" />
    }
    return <Globe className="w-3 h-3" />
  }

  const formatMetadata = (metadata: Record<string, any>) => {
    if (!metadata || Object.keys(metadata).length === 0) return 'No additional data'
    
    // Special formatting for common metadata patterns
    if (metadata.changes) {
      const changes = Object.entries(metadata.changes)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]: [string, any]) => {
          return `${key}: ${value.from} → ${value.to}`
        })
      return changes.length > 0 ? changes.join(', ') : 'No changes'
    }
    
    if (metadata.from_role && metadata.to_role) {
      return `${metadata.from_role} → ${metadata.to_role}`
    }
    
    if (metadata.count && metadata.resource_type) {
      return `${metadata.count} ${metadata.resource_type}s`
    }
    
    if (metadata.file_name) {
      return `${metadata.file_name} (${(metadata.file_size / 1024 / 1024).toFixed(2)}MB)`
    }
    
    // Default: show first few key-value pairs
    return Object.entries(metadata)
      .slice(0, 3)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
  }

  return (
    <>
      {/* Filters */}
      <div className="bg-card p-4 rounded-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="action-filter">Action</Label>
            <Select
              value={filters.action || ''}
              onValueChange={(value) => updateFilter('action', value)}
            >
              <SelectTrigger id="action-filter">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All actions</SelectItem>
                {filterOptions.actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource-filter">Resource Type</Label>
            <Select
              value={filters.resource || ''}
              onValueChange={(value) => updateFilter('resource', value)}
            >
              <SelectTrigger id="resource-filter">
                <SelectValue placeholder="All resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All resources</SelectItem>
                {filterOptions.resources.map((resource) => (
                  <SelectItem key={resource} value={resource}>
                    {resource.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-filter">User</Label>
            <Select
              value={filters.user || ''}
              onValueChange={(value) => updateFilter('user', value)}
            >
              <SelectTrigger id="user-filter">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All users</SelectItem>
                {filterOptions.users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email || user.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-filter">Date</Label>
            <Input
              id="date-filter"
              type="date"
              value={filters.date || ''}
              onChange={(e) => updateFilter('date', e.target.value)}
            />
          </div>
        </div>

        {Object.values(filters).some(Boolean) && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/activity')}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Activity Table */}
      <div className="bg-card rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>IP / Device</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No activity logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const user = getUserDisplay(log)
                return (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.image} />
                          <AvatarFallback>{user.initials}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                          <div className="font-medium">{user.name}</div>
                          {log.profiles?.email && (
                            <div className="text-muted-foreground text-xs">
                              {log.profiles.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionColors[log.action] as any || 'default'}>
                        <span className="flex items-center gap-1">
                          {actionIcons[log.action]}
                          {log.action.replace('_', ' ')}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{log.resource_type}</div>
                        {log.resource_name && (
                          <div className="text-muted-foreground text-xs">
                            {log.resource_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {formatMetadata(log.metadata)}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                {getDeviceIcon(log.user_agent)}
                                {log.ip_address || 'Unknown'}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs break-all">{log.user_agent || 'Unknown device'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{format(new Date(log.created_at), 'PP p')}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {format(new Date(log.created_at), 'PPpp')}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, totalCount)} of {totalCount} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>
              Full details of this activity log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={getUserDisplay(selectedLog).image} />
                      <AvatarFallback>{getUserDisplay(selectedLog).initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{getUserDisplay(selectedLog).name}</div>
                      {selectedLog.profiles?.email && (
                        <div className="text-sm text-muted-foreground">
                          {selectedLog.profiles.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Time</Label>
                  <p className="mt-1">{format(new Date(selectedLog.created_at), 'PPpp')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Action</Label>
                  <Badge variant={actionColors[selectedLog.action] as any || 'default'} className="mt-1">
                    <span className="flex items-center gap-1">
                      {actionIcons[selectedLog.action]}
                      {selectedLog.action.replace('_', ' ')}
                    </span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Resource Type</Label>
                  <p className="mt-1">{selectedLog.resource_type}</p>
                </div>
              </div>

              {selectedLog.resource_name && (
                <div>
                  <Label className="text-muted-foreground">Resource</Label>
                  <p className="mt-1">{selectedLog.resource_name}</p>
                  {selectedLog.resource_id && (
                    <p className="text-sm text-muted-foreground">ID: {selectedLog.resource_id}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">IP Address</Label>
                  <p className="mt-1">{selectedLog.ip_address || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Device</Label>
                  <p className="mt-1 text-sm">{selectedLog.user_agent || 'Unknown'}</p>
                </div>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Additional Data</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}