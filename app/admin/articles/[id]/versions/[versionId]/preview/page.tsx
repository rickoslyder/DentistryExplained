import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { MDXRenderer } from '@/components/mdx/mdx-renderer'

export default async function VersionPreviewPage({
  params,
}: {
  params: { id: string; versionId: string }
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

  // Get the version
  const { data: version, error } = await supabase
    .from('article_revisions')
    .select(`
      *,
      author:profiles!article_revisions_author_id_fkey (
        id,
        full_name,
        email,
        image_url
      ),
      category:categories (
        id,
        name,
        slug
      )
    `)
    .eq('id', params.versionId)
    .eq('article_id', params.id)
    .single()

  if (error || !version) {
    notFound()
  }

  const getAuthorDisplay = (author: any) => {
    const name = author?.full_name || author?.email || 'Unknown'
    const initials = name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    return { name, initials, image: author?.image_url }
  }

  const author = getAuthorDisplay(version.author)

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/admin/articles/${params.id}/edit`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Editor
          </Button>
        </Link>
        <Link href={`/admin/articles/${params.id}/edit?tab=versions`}>
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore This Version
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Version Preview</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Revision #{version.revision_number}
              </p>
            </div>
            <Badge variant={
              version.status === 'published' ? 'default' :
              version.status === 'draft' ? 'secondary' : 'outline'
            }>
              {version.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={author.image} />
                <AvatarFallback>{author.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{author.name}</p>
                <p className="text-muted-foreground">
                  {format(new Date(version.created_at), 'PPp')}
                </p>
              </div>
            </div>
            {version.change_summary && (
              <div className="ml-auto">
                <p className="text-muted-foreground italic">
                  "{version.change_summary}"
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{version.title}</CardTitle>
          {version.excerpt && (
            <p className="text-lg text-muted-foreground mt-2">
              {version.excerpt}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4">
            {version.category && (
              <Badge variant="secondary">
                {version.category.name}
              </Badge>
            )}
            {version.tags && version.tags.length > 0 && (
              <div className="flex gap-2">
                {version.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose prose-lg max-w-none">
            <MDXRenderer content={version.content} />
          </div>
        </CardContent>
      </Card>

      {/* SEO Preview */}
      {(version.meta_title || version.meta_description || version.meta_keywords?.length > 0) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>SEO Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {version.meta_title && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meta Title</p>
                <p className="text-lg">{version.meta_title}</p>
              </div>
            )}
            {version.meta_description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meta Description</p>
                <p>{version.meta_description}</p>
              </div>
            )}
            {version.meta_keywords && version.meta_keywords.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Meta Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {version.meta_keywords.map((keyword: string) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}