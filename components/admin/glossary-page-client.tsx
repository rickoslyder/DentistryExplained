'use client'

import { GlossaryTermGenerator } from '@/components/admin/glossary-term-generator'
import { GlossaryMetadataEnhancer } from '@/components/admin/glossary-metadata-enhancer'
import { GlossaryTable } from '@/components/admin/glossary-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { BookOpen, TrendingUp, Copy, Youtube } from 'lucide-react'

interface GlossaryPageClientProps {
  stats: {
    termStats: any[]
    allTerms: any[]
    totalTerms: number
    totalViews: number
    totalCopies: number
    totalYouTube: number
    termsWithMissingMetadata: number
  }
}

export function GlossaryPageClient({ stats }: GlossaryPageClientProps) {
  const handleUpdate = () => {
    // Reload the page to refresh data
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Glossary Management</h1>
          {stats.termsWithMissingMetadata > 0 && (
            <p className="text-muted-foreground mt-1">
              {stats.termsWithMissingMetadata} terms have incomplete metadata
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <GlossaryMetadataEnhancer 
            allTerms={stats.allTerms}
            termsWithMissingMetadata={stats.termsWithMissingMetadata}
          />
          <GlossaryTermGenerator />
        </div>
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
          <GlossaryTable 
            terms={stats.allTerms} 
            onUpdate={handleUpdate}
          />
        </CardContent>
      </Card>
    </div>
  )
}