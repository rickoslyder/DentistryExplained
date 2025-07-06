'use client'

import { useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Edit, 
  Trash, 
  MoreHorizontal, 
  Eye, 
  Copy,
  Search,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Article {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  created_at: string
  published_at: string | null
  views: number
  is_featured: boolean
  category: { name: string } | null
  author: { full_name: string } | null
}

interface ArticlesDataTableProps {
  articles: Article[]
}

export function ArticlesDataTable({ articles }: ArticlesDataTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const router = useRouter()
  
  // Filter articles based on search and status
  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || article.status === statusFilter
    
    return matchesSearch && matchesStatus
  })
  
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredArticles.map(a => a.id)))
    } else {
      setSelectedIds(new Set())
    }
  }
  
  // Handle individual selection
  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return
    
    try {
      const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete article')
      
      toast.success('Article deleted successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete article')
    }
  }
  
  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/articles/${id}/duplicate`, {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Failed to duplicate article')
      
      toast.success('Article duplicated successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to duplicate article')
    }
  }
  
  const handleBulkDelete = async () => {
    try {
      const response = await fetch('/api/admin/articles/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      
      if (!response.ok) throw new Error('Failed to delete articles')
      
      toast.success(`${selectedIds.size} articles deleted successfully`)
      setSelectedIds(new Set())
      setShowBulkDeleteDialog(false)
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete articles')
    }
  }
  
  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      archived: 'bg-red-100 text-red-800',
    }
    
    return (
      <Badge className={styles[status as keyof typeof styles] || styles.draft}>
        {status}
      </Badge>
    )
  }
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }
  
  return (
    <div>
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Status: {statusFilter === 'all' ? 'All' : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('published')}>
                Published
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('draft')}>
                Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('archived')}>
                Archived
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            onClick={() => setShowBulkDeleteDialog(true)}
          >
            <Trash className="w-4 h-4 mr-2" />
            Delete {selectedIds.size} selected
          </Button>
        )}
      </div>
      
      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={filteredArticles.length > 0 && filteredArticles.every(a => selectedIds.has(a.id))}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Views</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No articles found
                </TableCell>
              </TableRow>
            ) : (
              filteredArticles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(article.id)}
                      onCheckedChange={(checked) => handleSelectOne(article.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{article.title}</p>
                      <p className="text-sm text-gray-500">{article.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>{article.category?.name || '-'}</TableCell>
                  <TableCell>{article.author?.full_name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(article.status)}
                      {article.is_featured && (
                        <Badge variant="outline">Featured</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{article.views}</TableCell>
                  <TableCell>{formatDate(article.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/${article.slug}`} target="_blank">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/articles/${article.id}/edit`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(article.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(article.id)}
                          className="text-red-600"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} articles?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected articles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>
              Delete Articles
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}