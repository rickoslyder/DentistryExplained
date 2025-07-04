import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ArticlesDataTable } from '@/components/admin/articles-data-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

async function getArticles() {
  const supabase = await createServerSupabaseClient()
  
  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories(name),
      author:profiles!articles_author_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching articles:', error)
    return []
  }
  
  return articles || []
}

export default async function ArticlesPage() {
  const articles = await getArticles()
  
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-600 mt-1">Manage your dental education content</p>
        </div>
        <Link href="/admin/articles/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </Link>
      </div>
      
      <ArticlesDataTable articles={articles} />
    </div>
  )
}