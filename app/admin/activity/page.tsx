import { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ActivityLogsView } from '@/components/admin/activity-logs-view'

export const metadata: Metadata = {
  title: 'Activity Logs - Admin',
  description: 'View system activity logs and audit trail',
}

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

interface SearchParams {
  page?: string
  action?: string
  resource?: string
  user?: string
  date?: string
}

async function getActivityLogs(searchParams: SearchParams, userId: string) {
  const supabase = await createServerSupabaseClient()
  
  const page = parseInt(searchParams.page || '1')
  const limit = 50
  const offset = (page - 1) * limit
  
  // Build query
  let query = supabase
    .from('activity_logs')
    .select(`
      id,
      created_at,
      user_id,
      action,
      resource_type,
      resource_id,
      resource_name,
      metadata,
      ip_address,
      user_agent,
      profiles!activity_logs_user_id_fkey (
        full_name,
        email,
        image_url
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  // Apply filters
  if (searchParams.action) {
    query = query.eq('action', searchParams.action)
  }
  
  if (searchParams.resource) {
    query = query.eq('resource_type', searchParams.resource)
  }
  
  if (searchParams.user) {
    query = query.eq('user_id', searchParams.user)
  }
  
  if (searchParams.date) {
    const date = new Date(searchParams.date)
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    
    query = query
      .gte('created_at', date.toISOString())
      .lt('created_at', nextDay.toISOString())
  }
  
  const { data: logs, error, count } = await query
  
  if (error) {
    console.error('Error fetching activity logs:', error)
    return { logs: [], totalCount: 0, totalPages: 0 }
  }
  
  const totalPages = Math.ceil((count || 0) / limit)
  
  return {
    logs: logs as ActivityLog[],
    totalCount: count || 0,
    totalPages,
  }
}

// Get unique values for filters
async function getFilterOptions() {
  const supabase = await createServerSupabaseClient()
  
  // Get unique actions
  const { data: actions } = await supabase
    .from('activity_logs')
    .select('action')
    .order('action')
  
  const uniqueActions = [...new Set(actions?.map(a => a.action) || [])]
  
  // Get unique resource types
  const { data: resources } = await supabase
    .from('activity_logs')
    .select('resource_type')
    .order('resource_type')
  
  const uniqueResources = [...new Set(resources?.map(r => r.resource_type) || [])]
  
  // Get users who have activity
  const { data: users } = await supabase
    .from('activity_logs')
    .select(`
      user_id,
      profiles!activity_logs_user_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .order('user_id')
  
  const uniqueUsers = users?.reduce((acc, u) => {
    if (u.profiles && !acc.find(user => user.id === u.profiles.id)) {
      acc.push(u.profiles)
    }
    return acc
  }, [] as Array<{ id: string; full_name?: string; email?: string }>) || []
  
  return {
    actions: uniqueActions,
    resources: uniqueResources,
    users: uniqueUsers,
  }
}

export default async function ActivityLogsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { userId } = await auth()
  const user = await currentUser()
  
  if (!userId || !user) {
    redirect('/sign-in')
  }
  
  const supabase = await createServerSupabaseClient()
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_id', userId)
    .single()
  
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }
  
  const [{ logs, totalCount, totalPages }, filterOptions] = await Promise.all([
    getActivityLogs(searchParams, userId),
    getFilterOptions(),
  ])
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <p className="text-muted-foreground mt-2">
          View all system activity and audit trail
        </p>
      </div>
      
      <ActivityLogsView
        logs={logs}
        totalCount={totalCount}
        totalPages={totalPages}
        currentPage={parseInt(searchParams.page || '1')}
        filters={{
          action: searchParams.action,
          resource: searchParams.resource,
          user: searchParams.user,
          date: searchParams.date,
        }}
        filterOptions={filterOptions}
      />
    </div>
  )
}