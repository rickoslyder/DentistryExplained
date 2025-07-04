import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { ArticlesDataTable } from '@/components/admin/articles-data-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { PaginationWrapper, PaginationInfo } from '@/components/ui/pagination-wrapper'

const ITEMS_PER_PAGE = 20

async function getArticles(page: number = 1) {
  const supabase = await createServerSupabaseClient()
  const offset = (page - 1) * ITEMS_PER_PAGE
  
  // Get total count
  const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
  
  // Get paginated articles
  const { data: articles, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories(name),
      author:profiles!articles_author_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + ITEMS_PER_PAGE - 1)
  
  if (error) {
    console.error('Error fetching articles:', error)
    return { articles: [], totalCount: 0 }
  }
  
  return { articles: articles || [], totalCount: count || 0 }
}

interface PageProps {
  searchParams: { page?: string }
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const currentPage = parseInt(searchParams.page || '1')
  const { articles, totalCount } = await getArticles(currentPage)
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  
  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 7
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      
      let start = Math.max(2, currentPage - 2)
      let end = Math.min(totalPages - 1, currentPage + 2)
      
      if (currentPage <= 3) {
        end = maxVisible - 1
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - maxVisible + 2
      }
      
      if (start > 2) pages.push(-1)
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      if (end < totalPages - 1) pages.push(-1)
      
      pages.push(totalPages)
    }
    
    return pages
  }
  
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
      
      <div className="mb-4">
        <PaginationInfo
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
      
      <ArticlesDataTable articles={articles} />
      
      {totalPages > 1 && (
        <div className="mt-6">
          <PaginationWrapper
            currentPage={currentPage}
            totalPages={totalPages}
            pageNumbers={generatePageNumbers()}
            hasNextPage={currentPage < totalPages}
            hasPreviousPage={currentPage > 1}
            onPageChange={(page) => {
              window.location.href = page === 1 ? '/admin/articles' : `/admin/articles?page=${page}`
            }}
          />
        </div>
      )}
    </div>
  )
}