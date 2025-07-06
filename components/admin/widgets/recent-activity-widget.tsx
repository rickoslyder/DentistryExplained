'use client'

import { WidgetWrapper } from './widget-wrapper'
import { useWidgetData } from '@/hooks/use-widget-data'
import type { WidgetComponentProps } from '@/lib/widgets/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { 
  FileText, 
  Users, 
  Settings, 
  Upload, 
  Download,
  Edit,
  Trash,
  LogIn,
  UserPlus,
  Shield,
  ChevronRight
} from 'lucide-react'

interface ActivityLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string | null
  details: any
  created_at: string
  profiles: {
    first_name: string | null
    last_name: string | null
    email: string
    avatar_url: string | null
  }
}

interface ActivityData {
  logs: ActivityLog[]
  totalCount: number
}

const actionIcons: Record<string, any> = {
  create: FileText,
  update: Edit,
  delete: Trash,
  login: LogIn,
  register: UserPlus,
  upload: Upload,
  download: Download,
  settings: Settings,
  professional_verification: Shield,
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  login: 'bg-gray-100 text-gray-800',
  register: 'bg-purple-100 text-purple-800',
  upload: 'bg-yellow-100 text-yellow-800',
  download: 'bg-indigo-100 text-indigo-800',
}

export function RecentActivityWidget({ id, config, isEditing, onRemove }: WidgetComponentProps) {
  const { data, error, isLoading, refetch } = useWidgetData<ActivityData>({
    fetchFn: async () => {
      const response = await fetch('/api/admin/dashboard/widgets/activity?limit=8')
      if (!response.ok) throw new Error('Failed to fetch activity')
      return response.json()
    },
    refreshInterval: 30000, // Refresh every 30 seconds
  })

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || FileText
    return Icon
  }

  const getActionColor = (action: string) => {
    return actionColors[action] || 'bg-gray-100 text-gray-800'
  }

  const getUserDisplay = (log: ActivityLog) => {
    const name = log.profiles?.first_name && log.profiles?.last_name 
      ? `${log.profiles.first_name} ${log.profiles.last_name}`
      : log.profiles?.email || 'Unknown User'
    
    const initials = log.profiles?.first_name && log.profiles?.last_name
      ? `${log.profiles.first_name[0]}${log.profiles.last_name[0]}`
      : log.profiles?.email?.[0]?.toUpperCase() || '?'
    
    return { name, initials }
  }

  const getActionDescription = (log: ActivityLog) => {
    const resourceName = log.details?.name || log.details?.title || log.resource_id || ''
    
    switch (log.action) {
      case 'create':
        return `created ${log.resource_type} "${resourceName}"`
      case 'update':
        return `updated ${log.resource_type} "${resourceName}"`
      case 'delete':
        return `deleted ${log.resource_type} "${resourceName}"`
      case 'login':
        return 'logged in'
      case 'register':
        return 'registered a new account'
      case 'professional_verification':
        return 'submitted professional verification'
      default:
        return `performed ${log.action} on ${log.resource_type}`
    }
  }

  return (
    <WidgetWrapper
      title={config.title}
      isEditing={isEditing}
      onRemove={onRemove}
      isLoading={isLoading}
      error={error}
      headerAction={
        <Link href="/admin/activity">
          <Button variant="ghost" size="sm" className="h-8 text-xs">
            View All
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      }
    >
      <div className="space-y-3">
        {data?.logs.map((log) => {
          const { name, initials } = getUserDisplay(log)
          const Icon = getActionIcon(log.action)
          
          return (
            <div key={log.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={log.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm">
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground ml-1">
                      {getActionDescription(log)}
                    </span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                </p>
              </div>
              
              <Badge variant="secondary" className={cn('text-xs', getActionColor(log.action))}>
                {log.action}
              </Badge>
            </div>
          )
        })}
        
        {(!data?.logs || data.logs.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        )}
      </div>
    </WidgetWrapper>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}