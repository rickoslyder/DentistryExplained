import { Suspense } from 'react'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { VersionDiffViewer } from '@/components/admin/version-diff-viewer'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function VersionComparePage({
  params,
}: {
  params: { id: string }
}) {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  const supabase = await createServerSupabaseClient()
  
  // Check if user has admin/editor access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_id', user.id)
    .single()
  
  if (!profile || !['admin', 'editor'].includes(profile.role || '')) {
    redirect('/admin')
  }

  // Get article details
  const { data: article } = await supabase
    .from('articles')
    .select('title')
    .eq('id', params.id)
    .single()

  if (!article) {
    redirect('/admin/articles')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href={`/admin/articles/${params.id}/edit`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Editor
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Version Comparison</h1>
        <p className="text-muted-foreground">
          Comparing versions of "{article.title}"
        </p>
      </div>

      <Suspense fallback={<div>Loading comparison...</div>}>
        <VersionDiffViewer articleId={params.id} />
      </Suspense>
    </div>
  )
}