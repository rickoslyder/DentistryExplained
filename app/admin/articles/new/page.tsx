import { ArticleEditor } from '@/components/admin/article-editor'
export const dynamic = 'force-dynamic'

import { createServerSupabaseClient } from '@/lib/supabase-auth'

async function getCategories() {
  const supabase = await createServerSupabaseClient()
  
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('display_order')
  
  return categories || []
}

export default async function NewArticlePage() {
  const categories = await getCategories()
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Article</h1>
        <p className="text-gray-600 mt-1">Write and publish dental education content</p>
      </div>
      
      <ArticleEditor categories={categories} />
    </div>
  )
}