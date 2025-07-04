import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, ChevronRight, FileText, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { CategoryClientPage } from './client-page'

interface PageProps {
  params: {
    slug: string
  }
}

const ITEMS_PER_PAGE = 12

async function getCategoryWithArticles(slug: string) {
  const supabase = await createServerSupabaseClient()
  
  // Get category
  const { data: category, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (categoryError || !category) {
    return null
  }
  
  // Get total count of articles
  const { count } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', category.id)
    .eq('status', 'published')
  
  // Get initial articles
  const { data: articles } = await supabase
    .from('articles')
    .select(`
      id,
      slug,
      title,
      excerpt,
      read_time,
      views,
      is_featured,
      published_at,
      tags
    `)
    .eq('category_id', category.id)
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(ITEMS_PER_PAGE)
  
  // Get subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon')
    .eq('parent_id', category.id)
    .order('display_order')
  
  return {
    ...category,
    articles: articles || [],
    subcategories: subcategories || [],
    totalArticles: count || 0
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', slug)
    .single()
  
  if (!category) {
    return {
      title: 'Category Not Found | Dentistry Explained',
      description: 'The requested category could not be found.'
    }
  }
  
  return {
    title: `${category.name} | Dentistry Explained`,
    description: category.description || `Explore articles about ${category.name} and improve your dental health knowledge.`
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const category = await getCategoryWithArticles(slug)
  
  if (!category) {
    notFound()
  }
  
  const featuredArticles = category.articles.filter(a => a.is_featured)
  const regularArticles = category.articles.filter(a => !a.is_featured)
  
  // Get icon component based on icon name
  const iconComponents: Record<string, any> = {
    'FileText': FileText,
    'TrendingUp': TrendingUp,
    // Add more icons as needed
  }
  
  const IconComponent = iconComponents[category.icon || 'FileText'] || FileText
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Header */}
        <div className="mb-12">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
              <IconComponent className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{category.name}</h1>
              <p className="text-lg text-gray-600 mt-2">{category.description}</p>
            </div>
          </div>
        </div>
        
        {/* Subcategories */}
        {category.subcategories.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Subcategories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {category.subcategories.map((subcat) => (
                <Link key={subcat.id} href={`/categories/${subcat.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-gray-900 mb-2">{subcat.name}</h3>
                      <p className="text-sm text-gray-600">{subcat.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Articles */}
        <CategoryClientPage 
          category={{
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description
          }}
          initialArticles={category.articles}
          totalCount={category.totalArticles}
        />
      </div>
      
      <Footer />
    </div>
  )
}