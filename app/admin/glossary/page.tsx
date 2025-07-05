import { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { GlossaryTermGenerator } from '@/components/admin/glossary-term-generator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, TrendingUp, Copy, Youtube } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Glossary Management | Admin',
  description: 'Manage glossary terms and view analytics',
}

async function getGlossaryStats() {
  const supabase = await createServerSupabaseClient()
  
  // Get term stats
  const { data: termStats } = await supabase
    .from('glossary_term_stats')
    .select('*')
    .order('total_views', { ascending: false })
    .limit(10)

  // Get all terms with categories
  const { data: allTerms } = await supabase
    .from('glossary_terms')
    .select('id, term, category, difficulty, created_at')
    .order('created_at', { ascending: false })

  // Get total counts
  const { count: totalTerms } = await supabase
    .from('glossary_terms')
    .select('*', { count: 'exact', head: true })

  // Get interaction totals
  const { data: interactionStats } = await supabase
    .from('glossary_interactions')
    .select('interaction_type')
  
  const interactionCounts = interactionStats?.reduce((acc, item) => {
    acc[item.interaction_type] = (acc[item.interaction_type] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  return {
    termStats: termStats || [],
    allTerms: allTerms || [],
    totalTerms: totalTerms || 0,
    totalViews: interactionCounts.view || 0,
    totalCopies: interactionCounts.copy || 0,
    totalYouTube: interactionCounts.youtube || 0,
  }
}

export default async function AdminGlossaryPage() {
  const stats = await getGlossaryStats()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Glossary Management</h1>
        <GlossaryTermGenerator />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Terms</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTerms}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terms Copied</CardTitle>
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCopies.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YouTube Searches</CardTitle>
            <Youtube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalYouTube.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Terms */}
      {stats.termStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Terms</CardTitle>
            <CardDescription>Terms with the highest engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Term</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Copies</TableHead>
                  <TableHead>YouTube</TableHead>
                  <TableHead>Total Engagement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.termStats.map((stat: any) => (
                  <TableRow key={stat.term_id}>
                    <TableCell className="font-medium">{stat.term}</TableCell>
                    <TableCell>{stat.total_views}</TableCell>
                    <TableCell>{stat.total_copies}</TableCell>
                    <TableCell>{stat.total_youtube}</TableCell>
                    <TableCell className="font-semibold">
                      {stat.total_views + stat.total_copies + stat.total_youtube}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Terms */}
      <Card>
        <CardHeader>
          <CardTitle>All Glossary Terms</CardTitle>
          <CardDescription>
            Complete list of terms in the glossary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Term</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.allTerms.map((term: any) => (
                <TableRow key={term.id}>
                  <TableCell className="font-medium">{term.term}</TableCell>
                  <TableCell>
                    {term.category && (
                      <Badge variant="outline">{term.category}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {term.difficulty && (
                      <Badge variant={term.difficulty === 'basic' ? 'secondary' : 'default'}>
                        {term.difficulty}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(term.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" disabled>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}