import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, ChevronRight, FileText, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: {
    slug: string
  }
}

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
  
  // Get articles in this category
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
  
  // Get subcategories
  const { data: subcategories } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon')
    .eq('parent_id', category.id)
    .order('display_order')
  
  return {
    ...category,
    articles: articles || [],
    subcategories: subcategories || []
  }
}

export async function generateMetadata({ params }: PageProps) {
  const supabase = await createServerSupabaseClient()
  const { data: category } = await supabase
    .from('categories')
    .select('name, description')
    .eq('slug', params.slug)
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
  const category = await getCategoryWithArticles(params.slug)
  
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
        
        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredArticles.map((article) => (
                <Link key={article.id} href={`/${category.slug}/${article.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">{article.title}</CardTitle>
                        <Badge className="bg-primary/10 text-primary">Featured</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4 line-clamp-2">
                        {article.excerpt}
                      </CardDescription>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {article.read_time} min
                          </span>
                          <span>{article.views} views</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Regular Articles */}
        {regularArticles.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {featuredArticles.length > 0 ? 'More Articles' : 'Articles'}
            </h2>
            <div className="space-y-4">
              {regularArticles.map((article) => (
                <Link key={article.id} href={`/${category.slug}/${article.slug}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                            {article.title}
                          </h3>
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {article.read_time} min read
                            </span>
                            <span>{article.views} views</span>
                            {article.published_at && (
                              <span>
                                {new Date(article.published_at).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {category.articles.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
              <p className="text-gray-600">
                We're working on adding content to this category. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  )
}