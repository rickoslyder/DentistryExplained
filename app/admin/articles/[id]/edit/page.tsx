import { ArticleEditor } from '@/components/admin/article-editor'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getArticle(id: string) {
  const supabase = await createServerSupabaseClient()
  
  const { data: article, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !article) {
    notFound()
  }
  
  return article
}

async function getCategories() {
  const supabase = await createServerSupabaseClient()
  
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('display_order')
  
  return categories || []
}

interface PageProps {
  params: { id: string }
}

export default async function EditArticlePage({ params }: PageProps) {
  const [article, categories] = await Promise.all([
    getArticle(params.id),
    getCategories()
  ])
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Article</h1>
        <p className="text-gray-600 mt-1">Update your dental education content</p>
      </div>
      
      <ArticleEditor 
        article={article} 
        categories={categories} 
        mode="edit"
      />
    </div>
  )
}