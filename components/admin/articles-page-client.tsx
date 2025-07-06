'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Upload } from 'lucide-react'
import { ImportExportDialog } from '@/components/admin/import-export-dialog'

interface ArticlesPageClientProps {
  title: string
  description: string
  newArticleButton: React.ReactNode
}

export function ArticlesPageClient({ title, description, newArticleButton }: ArticlesPageClientProps) {
  const [importExportOpen, setImportExportOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setImportExportOpen(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Import/Export
          </Button>
          {newArticleButton}
        </div>
      </div>

      <ImportExportDialog
        open={importExportOpen}
        onOpenChange={setImportExportOpen}
      />
    </>
  )
}