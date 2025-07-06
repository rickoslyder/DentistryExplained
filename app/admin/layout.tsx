import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('[Admin Layout Debug] Starting admin layout check')
  
  const { userId, sessionClaims } = await auth()
  console.log('[Admin Layout Debug] userId:', userId)
  console.log('[Admin Layout Debug] sessionClaims:', JSON.stringify(sessionClaims, null, 2))
  
  if (!userId) {
    console.log('[Admin Layout Debug] No userId, redirecting to sign-in')
    redirect('/sign-in')
  }
  
  // Check if user is admin or editor
  const supabase = await createServerSupabaseClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_type, role')
    .eq('clerk_id', userId)
    .single()
  
  console.log('[Admin Layout Debug] Supabase query result:', { profile, error })
  console.log('[Admin Layout Debug] Profile user_type:', profile?.user_type)
  console.log('[Admin Layout Debug] Profile role:', profile?.role)
  
  const isNotProfessional = !profile || profile.user_type !== 'professional'
  const isNotAdminOrEditor = !['admin', 'editor'].includes(profile?.role || '')
  
  console.log('[Admin Layout Debug] isNotProfessional?', isNotProfessional)
  console.log('[Admin Layout Debug] isNotAdminOrEditor?', isNotAdminOrEditor)
  
  if (isNotProfessional || isNotAdminOrEditor) {
    console.log('[Admin Layout Debug] Access denied, redirecting to dashboard')
    redirect('/dashboard')
  }
  
  console.log('[Admin Layout Debug] Access granted, rendering admin layout')
  
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}