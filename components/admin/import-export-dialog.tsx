'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, Upload, FileJson, FileSpreadsheet, Check, X, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface ImportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  const [activeTab, setActiveTab] = useState('export')
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Export state
  const [exportFormat, setExportFormat] = useState('json')
  const [exportFilters, setExportFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    categoryId: ''
  })

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importFormat, setImportFormat] = useState('json')
  const [duplicateAction, setDuplicateAction] = useState('skip')
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{
    success: any[]
    errors: any[]
    skipped: any[]
  } | null>(null)

  const handleExport = async () => {
    setIsProcessing(true)
    try {
      const params = new URLSearchParams({
        format: exportFormat,
        ...exportFilters
      })

      const response = await fetch(`/api/admin/articles/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get filename from Content-Disposition header or create default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `articles-export-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Export successful',
        description: `Articles exported to ${filename}`,
      })

      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'An error occurred while exporting articles',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to import',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)
    setImportProgress(0)
    setImportResults(null)

    try {
      const formData = new FormData()
      formData.append('file', importFile)
      formData.append('format', importFormat)
      formData.append('duplicateAction', duplicateAction)

      const response = await fetch('/api/admin/articles/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setImportResults(data.results)
      setImportProgress(100)

      toast({
        title: 'Import completed',
        description: data.message,
      })

      // Refresh the page after successful import
      setTimeout(() => {
        router.refresh()
        onOpenChange(false)
      }, 2000)
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'An error occurred while importing articles',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      // Auto-detect format from file extension
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (extension === 'csv') {
        setImportFormat('csv')
      } else if (extension === 'json') {
        setImportFormat('json')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import/Export Articles</DialogTitle>
          <DialogDescription>
            Import articles from or export articles to CSV or JSON files
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div>
              <Label>Export Format</Label>
              <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="json" id="json" />
                  <Label htmlFor="json" className="flex items-center cursor-pointer">
                    <FileJson className="w-4 h-4 mr-2" />
                    JSON
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="flex items-center cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    CSV
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Filters (Optional)</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="status" className="text-sm">Status</Label>
                  <Select
                    value={exportFilters.status}
                    onValueChange={(value) => setExportFilters({ ...exportFilters, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="startDate" className="text-sm">Start Date</Label>
                  <input
                    type="date"
                    id="startDate"
                    className="w-full px-3 py-2 border rounded-md"
                    value={exportFilters.startDate}
                    onChange={(e) => setExportFilters({ ...exportFilters, startDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div>
              <Label htmlFor="file">Select File</Label>
              <input
                type="file"
                id="file"
                accept=".json,.csv"
                onChange={handleFileSelect}
                className="mt-2 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90
                  cursor-pointer"
              />
              {importFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {importFile.name} ({(importFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div>
              <Label>Import Format</Label>
              <RadioGroup value={importFormat} onValueChange={setImportFormat} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="json" id="import-json" />
                  <Label htmlFor="import-json" className="flex items-center cursor-pointer">
                    <FileJson className="w-4 h-4 mr-2" />
                    JSON
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="import-csv" />
                  <Label htmlFor="import-csv" className="flex items-center cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    CSV
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Duplicate Handling</Label>
              <RadioGroup value={duplicateAction} onValueChange={setDuplicateAction} className="mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="skip" id="skip" />
                  <Label htmlFor="skip" className="cursor-pointer">
                    Skip duplicates
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rename" id="rename" />
                  <Label htmlFor="rename" className="cursor-pointer">
                    Rename duplicates (add suffix)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="update" id="update" />
                  <Label htmlFor="update" className="cursor-pointer">
                    Update existing articles
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {importProgress > 0 && (
              <div>
                <Label>Import Progress</Label>
                <Progress value={importProgress} className="mt-2" />
              </div>
            )}

            {importResults && (
              <div className="space-y-2">
                {importResults.success.length > 0 && (
                  <Alert>
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      Successfully imported {importResults.success.length} articles
                    </AlertDescription>
                  </Alert>
                )}
                
                {importResults.errors.length > 0 && (
                  <Alert variant="destructive">
                    <X className="h-4 w-4" />
                    <AlertDescription>
                      Failed to import {importResults.errors.length} articles
                      <ul className="mt-2 text-sm">
                        {importResults.errors.slice(0, 3).map((error, i) => (
                          <li key={i}>• {error.title}: {error.error}</li>
                        ))}
                        {importResults.errors.length > 3 && (
                          <li>• ...and {importResults.errors.length - 3} more</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {importResults.skipped.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Skipped {importResults.skipped.length} articles
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          {activeTab === 'export' ? (
            <Button onClick={handleExport} disabled={isProcessing}>
              {isProcessing ? 'Exporting...' : 'Export Articles'}
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={!importFile || isProcessing}>
              {isProcessing ? 'Importing...' : 'Import Articles'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}