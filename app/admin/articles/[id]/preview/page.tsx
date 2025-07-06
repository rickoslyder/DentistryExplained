import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import ArticlePreview from '@/components/admin/article-preview'

export const metadata: Metadata = {
  title: 'Preview Article | Admin',
  description: 'Preview article before publishing',
}

interface PreviewPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PreviewArticlePage({ params }: PreviewPageProps) {
  const { id } = await params
  const user = await currentUser()
  
  if (!user) {
    notFound()
  }
  
  const supabase = await createServerSupabaseClient()
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('clerk_id', user.id)
    .single()
  
  if (!profile || profile.role !== 'admin') {
    notFound()
  }
  
  // Fetch article with category
  const { data: article, error } = await supabase
    .from('articles')
    .select(`
      *,
      categories (
        id,
        name,
        slug
      )
    `)
    .eq('id', id)
    .single()
  
  if (error || !article) {
    notFound()
  }
  
  return <ArticlePreview article={article} />
}