import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { UsersManager } from '@/components/admin/users-manager'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { 
    page?: string
    search?: string
    type?: string
    role?: string
  }
}

async function getUsers(
  page: number = 1, 
  search?: string,
  userType?: string,
  role?: string
) {
  const supabase = await createServerSupabaseClient()
  const ITEMS_PER_PAGE = 20
  const offset = (page - 1) * ITEMS_PER_PAGE
  
  // Build query
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
  
  // Apply filters
  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
  }
  
  if (userType && userType !== 'all') {
    query = query.eq('user_type', userType)
  }
  
  if (role && role !== 'all') {
    query = query.eq('role', role)
  }
  
  // Get total count
  const { count } = await query
  
  // Get paginated data
  const { data: users, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)
  
  if (error) {
    console.error('Error fetching users:', error)
    return { users: [], totalCount: 0 }
  }
  
  // Get additional stats
  const { data: professionalStats } = await supabase
    .from('professional_verifications')
    .select('user_id, verification_status')
    .in('user_id', users.map(u => u.id))
  
  // Merge verification status
  const usersWithVerification = users.map(user => {
    const verification = professionalStats?.find(v => v.user_id === user.id)
    return {
      ...user,
      verification_status: verification?.verification_status || null
    }
  })
  
  return { 
    users: usersWithVerification, 
    totalCount: count || 0 
  }
}

async function getUserStats() {
  const supabase = await createServerSupabaseClient()
  
  const [
    { count: totalUsers },
    { count: patients },
    { count: professionals },
    { count: admins }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'patient'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'professional'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
  ])
  
  return {
    total: totalUsers || 0,
    patients: patients || 0,
    professionals: professionals || 0,
    admins: admins || 0
  }
}

export default async function UsersPage({ searchParams }: PageProps) {
  const currentPage = parseInt(searchParams.page || '1')
  const { users, totalCount } = await getUsers(
    currentPage,
    searchParams.search,
    searchParams.type,
    searchParams.role
  )
  const stats = await getUserStats()
  const totalPages = Math.ceil(totalCount / 20)
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
      </div>
      
      <UsersManager 
        users={users}
        stats={stats}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  )
}