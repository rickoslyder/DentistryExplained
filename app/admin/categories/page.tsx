import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { CategoriesManager } from '@/components/admin/categories-manager'

export const dynamic = 'force-dynamic'

async function getCategories() {
  const supabase = await createServerSupabaseClient()
  
  // Get categories
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('display_order')
  
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  
  // Get article counts for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
      
      return {
        ...category,
        article_count: count || 0
      }
    })
  )
  
  return categoriesWithCount
}

export default async function CategoriesPage() {
  const categories = await getCategories()
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <p className="text-gray-600 mt-1">Manage content categories and organization</p>
      </div>
      
      <CategoriesManager initialCategories={categories} />
    </div>
  )
}