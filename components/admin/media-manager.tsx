'use client'

import { useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { 
  Upload, 
  Grid, 
  List, 
  Search, 
  Filter,
  Download,
  Trash,
  Copy,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon
} from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'

interface MediaFile {
  name: string
  id: string
  created_at: string
  updated_at: string
  url: string
  type: string
  size: number
  metadata?: {
    mimetype?: string
    size?: number
  }
}

interface MediaManagerProps {
  files: MediaFile[]
  currentPage: number
  totalPages: number
  totalCount: number
}

export function MediaManager({ 
  files, 
  currentPage, 
  totalPages,
  totalCount 
}: MediaManagerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<MediaFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  
  // Update URL with search params
  const updateSearch = (params: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams.toString())
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === '') {
        current.delete(key)
      } else {
        current.set(key, value)
      }
    })
    
    // Reset to page 1 when filters change
    if (params.page === undefined) {
      current.set('page', '1')
    }
    
    router.push(`/admin/media?${current.toString()}`)
  }
  
  const handleSearch = (value: string) => {
    setSearch(value)
    updateSearch({ search: value })
  }
  
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }
      
      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      })
      
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload file',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  const handleDelete = async () => {
    if (!fileToDelete) return
    
    try {
      const response = await fetch(`/api/admin/media/${encodeURIComponent(fileToDelete.name)}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Delete failed')
      }
      
      toast({
        title: 'Success',
        description: 'File deleted successfully',
      })
      
      setShowDeleteDialog(false)
      setFileToDelete(null)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete file',
        variant: 'destructive',
      })
    }
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }
  
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: 'Copied',
      description: 'URL copied to clipboard',
    })
  }
  
  return (
    <>
      {/* Header Actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 flex-1">
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleUpload}
            className="hidden"
          />
          
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search files..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select
            value={searchParams.get('type') || 'all'}
            onValueChange={(value) => updateSearch({ type: value === 'all' ? null : value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="File type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Files Display */}
      {files.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No files found</p>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <Card 
              key={file.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedFile(file)}
            >
              <CardContent className="p-4">
                {file.type.startsWith('image/') ? (
                  <div className="relative aspect-square mb-2">
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                ) : (
                  <div className="aspect-square mb-2 flex items-center justify-center bg-gray-100 rounded">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Size</th>
                  <th className="text-left p-4">Created</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => (
                  <tr key={file.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <span className="font-medium">{file.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{file.type}</td>
                    <td className="p-4 text-sm text-muted-foreground">{formatFileSize(file.size)}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(file.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedFile(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(file.url)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFileToDelete(file)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} files
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => updateSearch({ page: String(currentPage - 1) })}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => updateSearch({ page: String(currentPage + 1) })}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      {/* File Details Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>File Details</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              {selectedFile.type.startsWith('image/') ? (
                <div className="relative aspect-video">
                  <Image
                    src={selectedFile.url}
                    alt={selectedFile.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center bg-gray-100 rounded">
                  <FileText className="h-24 w-24 text-gray-400" />
                </div>
              )}
              
              <div className="space-y-2">
                <div>
                  <Label>File Name</Label>
                  <p className="text-sm">{selectedFile.name}</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="text-sm">{selectedFile.type}</p>
                </div>
                <div>
                  <Label>Size</Label>
                  <p className="text-sm">{formatFileSize(selectedFile.size)}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="text-sm">{format(new Date(selectedFile.created_at), 'PPpp')}</p>
                </div>
                <div>
                  <Label>URL</Label>
                  <div className="flex items-center gap-2">
                    <Input value={selectedFile.url} readOnly className="text-sm" />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(selectedFile.url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (selectedFile) {
                  setFileToDelete(selectedFile)
                  setShowDeleteDialog(true)
                  setSelectedFile(null)
                }
              }}
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button
              onClick={() => {
                if (selectedFile) {
                  window.open(selectedFile.url, '_blank')
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {fileToDelete?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setFileToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}