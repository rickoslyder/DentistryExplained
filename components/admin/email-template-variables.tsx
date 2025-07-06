'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { extractVariables } from '@/lib/email/template-renderer'

interface Variable {
  name: string
  description: string
  required: boolean
}

interface EmailTemplateVariablesProps {
  variables: Variable[]
  onChange: (variables: Variable[]) => void
  templateContent: string
}

export function EmailTemplateVariables({ 
  variables, 
  onChange, 
  templateContent 
}: EmailTemplateVariablesProps) {
  const [newVariable, setNewVariable] = useState({ name: '', description: '', required: true })
  const [detectedVariables, setDetectedVariables] = useState<string[]>([])

  useEffect(() => {
    const detected = extractVariables(templateContent)
    setDetectedVariables(detected)
  }, [templateContent])

  const handleAddVariable = () => {
    if (!newVariable.name || !newVariable.description) return
    
    onChange([...variables, newVariable])
    setNewVariable({ name: '', description: '', required: true })
  }

  const handleRemoveVariable = (index: number) => {
    onChange(variables.filter((_, i) => i !== index))
  }

  const handleUpdateVariable = (index: number, field: keyof Variable, value: any) => {
    const updated = [...variables]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const unusedVariables = variables.filter(v => !detectedVariables.includes(v.name))
  const undefinedVariables = detectedVariables.filter(
    v => !variables.find(variable => variable.name === v)
  )

  return (
    <div className="space-y-6">
      {/* Warnings */}
      {(unusedVariables.length > 0 || undefinedVariables.length > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Variable Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unusedVariables.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-800">Defined but not used:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {unusedVariables.map(v => (
                    <Badge key={v.name} variant="outline" className="bg-yellow-100">
                      {v.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {undefinedVariables.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-800">Used but not defined:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {undefinedVariables.map(v => (
                    <Badge key={v} variant="outline" className="bg-yellow-100">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Variable List */}
      <Card>
        <CardHeader>
          <CardTitle>Template Variables</CardTitle>
          <CardDescription>
            Define variables that can be used in the template with {'{{variableName}}'} syntax
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variable Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variables.map((variable, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {'{{'}{variable.name}{'}}'}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={variable.description}
                      onChange={(e) => handleUpdateVariable(index, 'description', e.target.value)}
                      placeholder="Variable description"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={variable.required}
                      onCheckedChange={(checked) => handleUpdateVariable(index, 'required', checked)}
                    />
                  </TableCell>
                  <TableCell>
                    {detectedVariables.includes(variable.name) ? (
                      <Badge variant="default" className="bg-green-600">Used</Badge>
                    ) : (
                      <Badge variant="secondary">Unused</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveVariable(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Add new variable row */}
              <TableRow>
                <TableCell>
                  <Input
                    value={newVariable.name}
                    onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                    placeholder="variableName"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={newVariable.description}
                    onChange={(e) => setNewVariable({ ...newVariable, description: e.target.value })}
                    placeholder="Variable description"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={newVariable.required}
                    onCheckedChange={(checked) => setNewVariable({ ...newVariable, required: checked })}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">New</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddVariable}
                    disabled={!newVariable.name || !newVariable.description}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detected Variables */}
      <Card>
        <CardHeader>
          <CardTitle>Detected Variables</CardTitle>
          <CardDescription>
            Variables found in your template content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {detectedVariables.length === 0 ? (
              <p className="text-sm text-gray-500">No variables detected in template</p>
            ) : (
              detectedVariables.map(variable => (
                <Badge
                  key={variable}
                  variant={variables.find(v => v.name === variable) ? 'default' : 'destructive'}
                >
                  {variable}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}