import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { MDXRenderer } from '@/components/mdx/mdx-renderer'
import { processMDX, generateTOC } from '@/lib/mdx'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArticleTrackingWrapper } from '@/components/article/article-tracking-wrapper'

interface PageProps {
  params: {
    category: string
    slug: string
  }
}

async function getArticle(category: string, slug: string) {
  const supabase = await createServerSupabaseClient()
  
  // Get article with category
  const { data: article, error } = await supabase
    .from('articles')
    .select(`
      *,
      category:categories!inner(name, slug),
      author:profiles!articles_author_id_fkey(full_name)
    `)
    .eq('slug', slug)
    .eq('categories.slug', category)
    .eq('status', 'published')
    .single()
  
  if (error || !article) {
    return null
  }
  
  // Get related articles
  const { data: relatedArticles } = await supabase
    .from('related_articles')
    .select(`
      related_article:articles!related_articles_related_article_id_fkey(
        slug,
        title,
        excerpt,
        read_time,
        category:categories(slug)
      )
    `)
    .eq('article_id', article.id)
    .limit(4)
  
  // Increment view count
  await supabase
    .from('articles')
    .update({ views: (article.views || 0) + 1 })
    .eq('id', article.id)
  
  return {
    ...article,
    relatedArticles: relatedArticles?.map(r => ({
      ...r.related_article,
      slug: `${r.related_article.category.slug}/${r.related_article.slug}`
    })) || []
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { category, slug } = await params
  const article = await getArticle(category, slug)
  
  if (!article) {
    return {
      title: 'Article Not Found | Dentistry Explained',
      description: 'The requested article could not be found.'
    }
  }
  
  return {
    title: article.meta_title || `${article.title} | Dentistry Explained`,
    description: article.meta_description || article.excerpt || 'Learn about dental health with Dentistry Explained.',
    keywords: article.meta_keywords?.join(', '),
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      type: 'article',
      publishedTime: article.published_at,
      authors: article.author?.full_name ? [article.author.full_name] : undefined,
      images: article.featured_image ? [article.featured_image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt,
      images: article.featured_image ? [article.featured_image] : undefined,
    }
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { category, slug } = await params
  
  // Check if this is one of our hardcoded example pages
  const hardcodedPages = [
    'dental-problems/tooth-decay',
    'dental-problems/gum-disease',
    'prevention/daily-oral-hygiene',
    'treatments/dental-fillings',
  ]
  
  const fullSlug = `${category}/${slug}`
  if (hardcodedPages.includes(fullSlug)) {
    // Redirect to the hardcoded page if it exists
    const { redirect } = await import('next/navigation')
    redirect(`/${fullSlug}`)
  }
  
  const article = await getArticle(category, slug)
  
  if (!article) {
    // For now, show a placeholder page for missing articles
    return (
      <div className="min-h-screen bg-white">
        <Header />
        
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Coming Soon</h1>
            <p className="text-xl text-gray-600 mb-8">
              This article is currently being written by our dental experts.
            </p>
            <p className="text-gray-500 mb-8">
              Article: <span className="font-medium">{slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
              <br />
              Category: <span className="font-medium">{category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </p>
            <Link href="/topics">
              <Button>
                Browse Available Articles
              </Button>
            </Link>
          </div>
        </div>
        
        <Footer />
      </div>
    )
  }
  
  // Process MDX content
  const { content, frontmatter, readTime } = await processMDX(article.content)
  
  // Generate table of contents
  const toc = generateTOC(article.content)
  
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <ArticleTrackingWrapper
        article={{
          slug: slug,
          title: article.title,
          category: article.category.name,
          readTime: article.read_time || readTime,
          publishedAt: article.published_at,
          excerpt: article.excerpt,
        }}
        fullSlug={`${category}/${slug}`}
      >
        <MDXRenderer
          content={content}
          frontmatter={{
            ...frontmatter,
            title: article.title,
            excerpt: article.excerpt,
            category: article.category.name,
            author: article.author?.full_name,
            date: article.published_at,
            tags: article.tags,
            featuredImage: article.featured_image,
          }}
          slug={`${category}/${slug}`}
          readTime={article.read_time || readTime}
          toc={toc}
          relatedArticles={article.relatedArticles}
        />
      </ArticleTrackingWrapper>
      
      <Footer />
    </div>
  )
}