'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RotateCcw, Eye, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { DiffViewer } from '@/components/admin/diff-viewer'

interface EmailTemplateVersion {
  id: string
  version_number: number
  subject: string
  body_html: string
  body_text?: string
  variables?: any[]
  change_notes?: string
  created_at: string
}

interface EmailTemplateHistoryProps {
  versions: EmailTemplateVersion[]
  currentTemplate: {
    subject: string
    body_html: string
    body_text?: string
  }
  onRestore: (version: EmailTemplateVersion) => void
}

export function EmailTemplateHistory({ 
  versions, 
  currentTemplate,
  onRestore 
}: EmailTemplateHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<EmailTemplateVersion | null>(null)
  const [showDiff, setShowDiff] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            View and restore previous versions of this template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Version</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Change Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Badge variant="default">Current</Badge>
                </TableCell>
                <TableCell>-</TableCell>
                <TableCell className="text-gray-500">
                  Current working version
                </TableCell>
                <TableCell className="text-right">-</TableCell>
              </TableRow>
              
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>
                    <Badge variant="outline">v{version.version_number}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(version.created_at), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>
                    {version.change_notes || (
                      <span className="text-gray-500">No notes provided</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedVersion(version)
                          setShowDiff(false)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedVersion(version)
                          setShowDiff(true)
                        }}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to restore this version?')) {
                            onRestore(version)
                          }
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Version Preview/Diff Dialog */}
      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {showDiff ? 'Version Comparison' : 'Version Preview'} - v{selectedVersion?.version_number}
            </DialogTitle>
            <DialogDescription>
              {showDiff 
                ? 'Showing differences between current version and selected version'
                : format(new Date(selectedVersion?.created_at || ''), 'MMMM d, yyyy h:mm a')
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedVersion?.change_notes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Change Notes:</p>
                <p className="text-sm text-gray-600 mt-1">{selectedVersion.change_notes}</p>
              </div>
            )}

            {showDiff ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Subject Line</h4>
                  <DiffViewer
                    oldContent={selectedVersion.subject}
                    newContent={currentTemplate.subject}
                  />
                </div>
                <div>
                  <h4 className="font-medium mb-2">HTML Body</h4>
                  <DiffViewer
                    oldContent={selectedVersion.body_html}
                    newContent={currentTemplate.body_html}
                  />
                </div>
                {(selectedVersion.body_text || currentTemplate.body_text) && (
                  <div>
                    <h4 className="font-medium mb-2">Plain Text Body</h4>
                    <DiffViewer
                      oldContent={selectedVersion.body_text || ''}
                      newContent={currentTemplate.body_text || ''}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Subject Line</h4>
                  <p className="p-3 bg-gray-50 rounded font-mono text-sm">
                    {selectedVersion?.subject}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">HTML Body</h4>
                  <div className="p-3 bg-gray-50 rounded">
                    <pre className="font-mono text-sm whitespace-pre-wrap">
                      {selectedVersion?.body_html}
                    </pre>
                  </div>
                </div>
                {selectedVersion?.body_text && (
                  <div>
                    <h4 className="font-medium mb-2">Plain Text Body</h4>
                    <div className="p-3 bg-gray-50 rounded">
                      <pre className="font-mono text-sm whitespace-pre-wrap">
                        {selectedVersion.body_text}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}