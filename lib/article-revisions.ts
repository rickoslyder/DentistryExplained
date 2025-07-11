import { createServerSupabaseClient } from '@/lib/supabase-auth'

interface CreateRevisionParams {
  articleId: string
  userId: string
  changeSummary: string
  fields?: {
    title?: string
    content?: string
    excerpt?: string
    status?: string
  }
}

export async function createArticleRevision({
  articleId,
  userId,
  changeSummary,
  fields = {}
}: CreateRevisionParams) {
  const supabase = await createServerSupabaseClient()
  
  // Get the current article state
  const { data: currentArticle, error: articleError } = await supabase
    .from('articles')
    .select('title, content, excerpt, status')
    .eq('id', articleId)
    .single()
    
  if (articleError || !currentArticle) {
    throw new Error('Article not found')
  }
  
  // Get the user's profile ID
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('clerk_id', userId)
    .single()
    
  if (profileError || !profile) {
    throw new Error('User profile not found')
  }
  
  // Get the latest revision number
  const { data: latestRevision } = await supabase
    .from('article_revisions')
    .select('revision_number')
    .eq('article_id', articleId)
    .order('revision_number', { ascending: false })
    .limit(1)
    .single()
    
  const nextRevisionNumber = (latestRevision?.revision_number || 0) + 1
  
  // Create the revision with the updated fields
  const revisionData = {
    article_id: articleId,
    title: fields.title || currentArticle.title,
    content: fields.content || currentArticle.content,
    excerpt: fields.excerpt || currentArticle.excerpt,
    status: fields.status || currentArticle.status,
    revision_number: nextRevisionNumber,
    author_id: profile.id,
    change_summary: changeSummary
  }
  
  const { error: revisionError } = await supabase
    .from('article_revisions')
    .insert(revisionData)
    
  if (revisionError) {
    throw new Error('Failed to create revision')
  }
  
  return { success: true, revisionNumber: nextRevisionNumber }
}