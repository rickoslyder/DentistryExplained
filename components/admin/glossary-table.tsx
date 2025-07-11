'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, Pencil } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { GlossaryTermEditor } from './glossary-term-editor'

interface GlossaryTerm {
  id: string
  term: string
  definition: string
  category: string | null
  difficulty: string | null
  pronunciation: string | null
  also_known_as: string[] | null
  related_terms: string[] | null
  example: string | null
  created_at: string
}

interface GlossaryTableProps {
  terms: GlossaryTerm[]
  onUpdate: () => void
}

export function GlossaryTable({ terms: initialTerms, onUpdate }: GlossaryTableProps) {
  const [editingTerm, setEditingTerm] = useState<GlossaryTerm | null>(null)
  const [terms, setTerms] = useState(initialTerms)

  const handleUpdate = () => {
    // Refresh the table data
    setEditingTerm(null)
    onUpdate()
  }

  return (
    <>
      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Term</TableHead>
              <TableHead>Cat.</TableHead>
              <TableHead>Diff.</TableHead>
              <TableHead className="text-center">
                <Tooltip>
                  <TooltipTrigger>Pron.</TooltipTrigger>
                  <TooltipContent>Pronunciation</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="text-center">
                <Tooltip>
                  <TooltipTrigger>Aliases</TooltipTrigger>
                  <TooltipContent>Also Known As</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="text-center">
                <Tooltip>
                  <TooltipTrigger>Related</TooltipTrigger>
                  <TooltipContent>Related Terms</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="text-center">
                <Tooltip>
                  <TooltipTrigger>Example</TooltipTrigger>
                  <TooltipContent>Example Usage</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead>Added</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.map((term) => {
              const hasAllMetadata = term.category && term.difficulty && 
                term.pronunciation && term.also_known_as && 
                term.related_terms && term.example
              
              return (
                <TableRow key={term.id}>
                  <TableCell className="font-medium">{term.term}</TableCell>
                  <TableCell>
                    {term.category ? (
                      <Badge variant="outline" className="text-xs">
                        {term.category}
                      </Badge>
                    ) : (
                      <div className="flex justify-center">
                        <X className="h-3 w-3 text-red-500" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {term.difficulty ? (
                      <Badge 
                        variant={term.difficulty === 'basic' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {term.difficulty}
                      </Badge>
                    ) : (
                      <div className="flex justify-center">
                        <X className="h-3 w-3 text-red-500" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {term.pronunciation ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Check className="h-3 w-3 text-green-600" />
                          </TooltipTrigger>
                          <TooltipContent>{term.pronunciation}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {term.also_known_as && term.also_known_as.length > 0 ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Check className="h-3 w-3 text-green-600" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {term.also_known_as.join(', ')}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {term.related_terms && term.related_terms.length > 0 ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Check className="h-3 w-3 text-green-600" />
                          </TooltipTrigger>
                          <TooltipContent>
                            {term.related_terms.join(', ')}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      {term.example ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Check className="h-3 w-3 text-green-600" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            {term.example}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(term.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!hasAllMetadata && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              Incomplete
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>Missing metadata fields</TooltipContent>
                        </Tooltip>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingTerm(term)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TooltipProvider>

      {editingTerm && (
        <GlossaryTermEditor
          term={editingTerm}
          open={!!editingTerm}
          onOpenChange={(open) => !open && setEditingTerm(null)}
          onUpdate={handleUpdate}
        />
      )}
    </>
  )
}